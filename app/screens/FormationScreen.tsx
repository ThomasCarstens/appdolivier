import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Linking,
  ActivityIndicator,
  Platform 
} from 'react-native';
import { auth, firebase, storage, database } from '../../firebase';
import { ref as ref_d, set, get, onValue, update } from 'firebase/database';
import RNPdf from 'react-native-pdf';
import { WebView } from 'react-native-webview';
// import { Audio, Video as OriginalVideo } from 'expo-av';
import { Audio, Video } from 'expo-av';

const triggerAudio = async (ref) => {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  ref.current.playAsync();
};



const FormationScreen = ({ route, navigation }) => {
  const { formationId, role } = route.params;
  const [formation, setFormation] = useState(null);
  const [inscriptionStatus, setInscriptionStatus] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [isDateValid, setIsDateValid] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [inscriptionFormat, setInscriptionFormat] = useState(null);
  const [videoData, setVideoData] = useState({ 
    id: null, 
    type: null, 
    embedUrl: null, 
    directUrl: null,
    thumbnail: null 
  });
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoPaused, setVideoPaused] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  const videoRef = useRef(null);
  const webViewRef = useRef(null);

  // Navigation setup
  const [inscriptionURL, setInscriptionURL] = useState('');
  
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Formation',
      headerStyle: {
        backgroundColor: '#00008B',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    //   tabBarStyle: {
    //     display:'flex',
    //     backgroundColor: '#6458D7',
    //     borderTopEndRadius: 18,
    //     borderTopLeftRadius: 18,
    // }
    });
  }, [navigation]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
}, []);

  // Helper function to extract YouTube video ID and get direct URL
  const extractYouTubeVideoData = async (url) => {
    if (!url) return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const videoId = match[1];
        
        return {
          id: videoId,
          type: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&showinfo=0&fs=1&autoplay=0`,
          directUrl: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
      }
    }
    
    return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
  };

  // Helper function to extract Google Drive file ID and attempt to get direct URL
  const extractGoogleDriveVideoData = async (url) => {
    if (!url) return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
    
    const drivePatterns = [
      /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
      /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
      /docs\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of drivePatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const fileId = match[1];
        
        // Attempt to get direct video URL (may not always work due to permissions)
        const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        const thumbnail = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        
        return { 
          id: fileId, 
          type: 'googledrive', 
          embedUrl: embedUrl,
          directUrl: directUrl,
          thumbnail: thumbnail
        };
      }
    }
    
    return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
  };

  // Helper function to process video URL and determine type
  const processVideoUrl = async (url) => {
    if (!url) return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
    
    // Check for YouTube first
    const youtubeData = await extractYouTubeVideoData(url);
    if (youtubeData.id) {
      return youtubeData;
    }
    
    // Check for Google Drive
    const driveData = await extractGoogleDriveVideoData(url);
    if (driveData.id) {
      return driveData;
    }
    
    // Check if it's already a direct video URL
    if (url.match(/\.(mp4|mov|avi|wmv|flv|webm|m4v)(\?.*)?$/i)) {
      return {
        id: 'direct',
        type: 'direct',
        embedUrl: null,
        directUrl: url,
        thumbnail: formation?.image || null
      };
    }
    
    return { id: null, type: null, embedUrl: null, directUrl: null, thumbnail: null };
  };

  // Video event handlers for expo-av
  const onVideoLoad = (status) => {
    if (status.isLoaded) {
      setIsVideoLoading(false);
      setVideoError(false);
      setVideoDuration(status.durationMillis / 1000);
    }
  };

  const onVideoError = (error) => {
    console.log('Video Error:', error);
    setVideoError(true);
    setIsVideoLoading(false);
  };

  const onVideoProgress = (status) => {
    if (status.isLoaded) {
      setVideoProgress(status.positionMillis / 1000);
    }
  };

  // Helper function to get video source based on type
  const getVideoSource = () => {
    if (videoData.type === 'direct' && videoData.directUrl) {
      return { uri: videoData.directUrl };
    }
    
    // For YouTube, don't try to use directUrl - it won't work with expo-av
    if (videoData.type === 'youtube') {
      return null; // Force fallback to WebView
    }
    
    if (videoData.type === 'googledrive' && videoData.directUrl) {
      return { uri: videoData.directUrl };
    }
    
    return null;
  };

  // Main data loading effect



  useEffect(() => {
    console.log(formationId)
    const formationRef = ref_d(database, `/formations/${formationId}`);
    const unsubscribe = onValue(formationRef, async (snapshot) => {
      const data = snapshot.val();
      console.log(data)
      if (data) {
        setFormation(data);
        setInscriptionFormat(data.inscriptionStatus);
        
        if (data.videoUrl) {
          const videoInfo = await processVideoUrl(data.videoUrl);
          setVideoData(videoInfo);
        }
        
        if (data.inscriptionStatus === "Externe") {
          setInscriptionURL(data.inscriptionURL);

        }
        checkDateValidity(data.date);
      } else {
        Alert.alert("Erreur", "Formation non trouvée");
        navigation.goBack();
      }
    });

    // Vérifier le statut d'inscription
    const checkInscriptionStatus = async () => {
      const user = auth.currentUser;
      if (user) {
                try {

        const demandeRef = ref_d(database, `/demandes/${user.uid}/${formationId}`);
        const snapshot = await get(demandeRef);

        if (snapshot.exists()) {
          setInscriptionStatus(snapshot.val().admin);
        } else {
          setInscriptionStatus(null);
        }          
        } catch (error) {
          console.error('Error checking inscription status:', error);

        }
      }
    };



    
    // Vérifier le consentement RGPD
    const checkConsent = async () => {
      const user = auth.currentUser;
      if (user) {
        try {

        const consentRef = ref_d(database, `/consentement/${user.uid}`);
        const snapshot = await get(consentRef);
        
        setHasConsent(snapshot.val() === true);
                } catch (error) {
          console.error('Error checking consent:', error);
          setHasConsent(false);
        }

      }
    };

    checkInscriptionStatus();
    checkConsent();

    return () => unsubscribe();
  }, [formationId]);



  const checkDateValidity = (date) => {
    const formationDate = new Date(date);
    const currentDate = new Date();
    const twoDaysFromNow = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    setIsDateValid(formationDate > twoDaysFromNow);
  };

    // Create HTML for embed videos (YouTube/Google Drive fallback)
  const createEmbedHTML = (embedUrl) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              overflow: hidden;
            }
            .video-container {
              position: relative;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            iframe {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="video-container">
            <iframe 
              src="${embedUrl}"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen>
            </iframe>
          </div>
        </body>
      </html>
    `;
  };

  // Render video player with expo-av and iOS audio optimization
  const renderVideo = () => {
    if (!videoData.id) return null;

    const videoSource = getVideoSource();
    
    // Try expo-av Video first for direct URLs
    if (videoSource && !videoError) {
      return (
        <View style={styles.videoPlayerContainer}>
          <Video
            ref={videoRef}
            source={videoSource}
            style={styles.videoPlayer}
            useNativeControls
            resizeMode="contain"
            shouldPlay={!videoPaused}
            onPlaybackStatusUpdate={onVideoLoad}
            onError={onVideoError}
            posterSource={videoData.thumbnail ? { uri: videoData.thumbnail } : undefined}
            isMuted={false} // Start muted for autoplay
          />
          {isVideoLoading && (
            <View style={styles.videoLoadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingVideoText}>Chargement de la vidéo...</Text>
            </View>
          )}
        </View>
      );
    }

    // Fallback to WebView for embed URLs
    if (videoData.embedUrl && !videoError) {
      return (
        <View style={styles.videoWrapper}>
          <WebView
            ref={webViewRef}
            style={styles.webView}
            source={{ html: createEmbedHTML(videoData.embedUrl) }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onLoad={() => setIsVideoLoading(false)}
            onError={() => setVideoError(true)}
            allowsFullscreenVideo={true}
            mediaPlaybackRequiresUserAction={false}
            scalesPageToFit={false}
            bounces={false}
            scrollEnabled={false}
          />
        </View>
      );
    }

    // Error state with simplified messaging
    return (
      <View style={styles.videoErrorContainer}>
        <Text style={styles.videoErrorText}>Impossible de charger la vidéo</Text>
        <Text style={styles.videoErrorSubtext}>
          {videoData.type === 'youtube' && 'YouTube'} 
          {videoData.type === 'googledrive' && 'Google Drive'} 
          {videoData.type === 'direct' && 'Vidéo'}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            setVideoError(false);
            setIsVideoLoading(true);
          }}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Registration handlers (keeping existing logic)
  const handleSignUp = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté pour vous inscrire.");
      return;
    }


    if (inscriptionStatus === 'en attente') {
      Alert.alert(
        `Inscription ${inscriptionStatus}`, 
        "Nous avons déjà une inscription de votre part. Pour plus d'informations, contactez: contact.esculappl@gmail.com"
      );

         return;
    }
    
    if (!isDateValid) {
      Alert.alert(
        "Inscription impossible sur Esculappl",
        "La formation commence dans moins de 2 jours ou est déjà passée. Veuillez contacter contact.esculappl@gmail.com pour toute demande urgente."
      );
      return;
    }

    if (!hasConsent) {
      Alert.alert(
        "Consentement RGPD requis",
        "Vous devez donner votre consentement RGPD pour vous inscrire à cette formation.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Donner mon consentement", onPress: () => {
            navigation.navigate('UserTabs');
            navigation.push('RGPD')
          
          }}
        ]
      );
      return;
    }

    // Procéder à l'inscription
    navigation.navigate('InscriptionFormation', { 
      formationId: formation.id, 
      formationTitle: formation.title });
  };

  const handleUnsubscribe = () => {
    if (!isDateValid) {
      Alert.alert(
        "Impossible de se désinscrire",
        "La formation commence dans moins de 2 jours ou est déjà passée. Veuillez contacter contact.esculappl@gmail.com pour toute modification."
      );
      return;
    }

    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir vous désinscrire de cette formation ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", onPress: async () => {
          const user = auth.currentUser;
          if (user) {
            // const demandeRef = ref_d(database, `/demandes/${user.uid}/${formationId}`);
              try {
                await update(ref_d(database, `/demandes/${user.uid}/${formationId}`), { 
                  admin: "désinscrit" 
                });

            Alert.alert("Succès", "Vous avez été désinscrit de la formation.");
                        } catch (error) {
                Alert.alert("Erreur", "Impossible de se désinscrire. Réessayez plus tard.");
              }
            }
} 
        }
      ]
    );
  };
  const handleExternalLink = () => {
    Alert.alert(
      'Site d\'inscription',
      `Vous allez être redirigé vers le site ${inscriptionURL}. Souhaitez-vous continuer ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel'
        },
        { 
          text: 'OK',
          onPress: () => {
            Linking.openURL(inscriptionURL).catch(err => {
              Alert.alert('Erreur', "Impossible d'ouvrir le lien: \n" + inscriptionURL);
            });
          }
        }
      ]
    );
  };

  const getButtonStyle = () => {
    if (!inscriptionStatus || inscriptionStatus === "désinscrit") return styles.signUpButton;
    return { ...styles.signUpButton, backgroundColor: '#808080' };
  };

  const getButtonText = () => {
    if (inscriptionFormat !== "Externe"){
       switch (inscriptionStatus) {
          case "en attente": return "Inscription en attente";
          case "Rejetée": return "Inscription rejetée";
          case "Validée": return "Se désinscrire";
          // case "Externe": return "Site d'inscriptions"
          default: return "S'inscrire";
      }
    } else { return "S\'inscrire en ligne" }
   
  };

  const handleButtonPress = () => {
    console.log('inscriptionStatus: ', inscriptionStatus)
    console.log('hasConsent: ', hasConsent)
    console.log('inscription Format: ', inscriptionFormat)

    if (inscriptionFormat=== "Externe"){
      handleExternalLink() 
    } else if (inscriptionStatus === "Validée") {
      handleUnsubscribe();
    } else if (!inscriptionStatus || inscriptionStatus=== "Rejetée" ||  inscriptionStatus === "désinscrit") {
      handleSignUp();
      
    } 
  };



  const handleDelete = () => {
    let toggleAction = (formation.active) ? "Désactiver" : "Réactiver";
    Alert.alert(
      "Confirmation",
      `Êtes-vous sûr de vouloir ${toggleAction} cette formation ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: toggleAction, onPress: () => {
          const formationRef = ref_d(database, `/formations/${formationId}`);
          set(formationRef, { ...formation, active: !(formation.active) })
            .then(() => {
              Alert.alert("Succès", `La formation a été ${toggleAction.toLowerCase()}`);
              navigation.goBack();
            })
            .catch((error) => {
              Alert.alert("Erreur", "Impossible de modifier la formation");
            });
        }}
      ]
    );
  };

  if (!formation) {
    return (
        <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a53ff" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }


  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Video/Image Section */}
      <View style={styles.mediaContainer}>
        {videoData.id ? (
          renderVideo()
        ) : (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: formation.image }} 
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        )}
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.headerSection}>

      <Text style={styles.title}>{formation.title}</Text>
          <Text style={styles.subtitle}>
            {formation.nature} de {formation.domaine}
          </Text>
        </View>

      {/* {(role.isAdmin === true) ? (
         <View style={styles.buttonContainer}>
         {formation.active && (
           <TouchableOpacity 
             style={getButtonStyle()}
             onPress={handleButtonPress}
           >
             <Text style={[
               styles.signUpButtonText, 
               inscriptionStatus === "Validée" ? { color: 'red' } : null
             ]}>
               {getButtonText()}
             </Text>
           </TouchableOpacity>
          )} 
         {role.isAdmin === true && (
           <>
             <TouchableOpacity 
               style={styles.modifyButton}
               onPress={() => navigation.navigate('AjoutFormation', { formation: formation, role: role })}
             >
               <Text style={styles.buttonText}>Modifier</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={styles.deleteButton}
               onPress={handleDelete}
             >
               <Text style={styles.buttonText}>{formation.active ? "Désactiver" : "Réactiver"}</Text>
             </TouchableOpacity>
           </>
         )}
       </View>
      ) : ( */}
        {/* <View style={styles.buttonContainer}>
         {formation.active && ( */}
         
           <TouchableOpacity 
             style={getButtonStyle()}
             onPress={handleButtonPress}
            //  disabled={inscriptionStatus === "en attente" || inscriptionStatus === "Rejetée"}
           >
             <Text style={[
               styles.signUpButtonText, 
               inscriptionStatus === "Validée" ? { color: 'red' } : null
             ]}>
               {getButtonText()}
             </Text>
           </TouchableOpacity>


        </View>
      {/* )} */}

      <Text style={styles.info}>Date: {new Date(formation.date).toLocaleDateString('fr-FR')} au {new Date(formation.date_de_fin).toLocaleDateString('fr-FR')}</Text>
      <Text style={styles.info}>Horaires: {formation.heureDebut} à {formation.heureFin}</Text>
      <Text style={styles.info}>Lieu: {formation.lieu}</Text>

      <Text style={styles.info}>Tarif étudiant: {formation.tarifEtudiant} € / Tarif médecin: {formation.tarifMedecin} €</Text>
      
      <Text style={styles.sectionTitle}>Documentation PDF</Text>
      {/* <Text style={styles.label}>[ Version Etudiante - Contacter Developpeur pour visionner les PDFs ]</Text> */}
      {formation.pdf ? (
        <View style={styles.pdfContainer}>
          <RNPdf trustAllCerts={false}
            source={{ uri: formation.pdf, cache: true }}
            style={styles.pdf}
            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`PDF loaded: ${numberOfPages} pages`);
            }}
            onError={(error) => {
              console.log('PDF Error:', error);
              Alert.alert('Erreur', String(error));
            }}
            enablePaging={true}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Page ${page} of ${numberOfPages}`);
            }}
          />
        </View>
      ) : (
        <Text style={styles.text}>Aucun document PDF disponible</Text>
      )}

      <Text style={styles.sectionTitle}>Année conseillée</Text>
      {Array.isArray(formation.anneeConseillee) ? (
        <View style={styles.yearsList}>
          {formation.anneeConseillee.map((year, index) => (
            <Text key={index} style={styles.yearItem}>
              • {year}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.text}>{formation.anneeConseillee}</Text>
      )}
            
      <Text style={styles.sectionTitle}>Prérequis</Text>
      <Text style={styles.text}>{formation.prerequis || "Non spécifié"}</Text>

      <Text style={styles.sectionTitle}>À savoir</Text>
      <Text style={styles.text}>{formation.instructions || "Non spécifié"}</Text>

      {/* <Image source={ require("../../assets/images/exemple_programme-pdf.jpg") } style={styles.programmeImage} /> */}


      
      <Text style={styles.sectionTitle}>Compétences acquises</Text>
      <Text style={styles.text}>{formation.competencesAcquises || "Non spécifié"}</Text>
      

      {/* <Text style={styles.sectionTitle}>Autres domaines</Text>
      <Text style={styles.text}>{formation.autresDomaine || "Non spécifié"}</Text> */}
      
      <Text style={styles.sectionTitle}>Affiliation DIU</Text>
      <Text style={styles.text}>{formation.affiliationDIU}</Text>
      

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
    
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  
  mediaContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#f8f9fa',
  },
    
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  
  image: {
    width: '100%',
    height: '100%',
  },
  
  videoPlayerContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
    position: 'relative',
  },
  
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
    
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
    
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 2,
  },
  
  loadingVideoText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 16,
  },
  
  videoErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  
  videoErrorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
    
  videoErrorSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
    
  retryButton: {
    backgroundColor: '#1a53ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
    
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
    
  contentContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  
  headerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
    
  buttonSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  buttonContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  signUpButton: {
    backgroundColor: '#1a53ff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modifyButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  
  signUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Info sections
  info: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  
  label: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  
  // Years list styling
  yearsList: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  
  yearItem: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
    lineHeight: 22,
  },
  
  // PDF container (commented out in code but keeping for reference)
  pdfContainer: {
    height: 400,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  
  pdf: {
    flex: 1,
    borderRadius: 8,
  },
  
  // Program image (referenced in commented code)
  programmeImage: {
    width: '90%',
    height: 300,
    alignSelf: 'center',
    marginVertical: 20,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  
  // Bottom spacer for scrolling
  bottomSpacer: {
    height: 40,
  },

  // Info Grid (for potential future use)
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
    
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  
  descriptionSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  
  formateurSection: {
    padding: 20,
  },
  
  formateur: {
    fontSize: 16,
    color: '#1a53ff',
    fontWeight: '500',
  },
});
export default FormationScreen;