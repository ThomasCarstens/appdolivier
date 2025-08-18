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
import { WebView } from 'react-native-webview';
// import { Audio, Video as OriginalVideo } from 'expo-av';
import { Audio, Video } from 'expo-av';

const triggerAudio = async (ref) => {
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
  ref.current.playAsync();
};

// const Video = ({ ...props }) => {
//   const ref = useRef(null);
//   const [status, setStatus] = useState({});

//   useEffect(() => {
//     if (status.isPlaying) triggerAudio(ref);
//   }, [ref, status.isPlaying]);

//   return (
//     <OriginalVideo
//       ref={ref}
//       onPlaybackStatusUpdate={(status) => setStatus(status)}
//       useNativeControls
//       {...props}
//     />
//   );
// };



const FormationScreen = ({ route, navigation }) => {
  const { formationId, role } = route.params;
  
  // State variables
  const [formation, setFormation] = useState(null);
  const [inscriptionStatus, setInscriptionStatus] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [isDateValid, setIsDateValid] = useState(true);
  const [inscriptionFormat, setInscriptionFormat] = useState(null);
  const [inscriptionURL, setInscriptionURL] = useState('');
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
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'Formation',
      headerStyle: {
        backgroundColor: '#1a53ff',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
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
    const formationRef = ref_d(database, `/formations/${formationId}`);
    const unsubscribe = onValue(formationRef, async (snapshot) => {
      const data = snapshot.val();
      
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
        "Inscription impossible",
        "La formation commence dans moins de 2 jours ou est déjà passée. Contactez contact.esculappl@gmail.com pour toute demande urgente."
      );
      return;
    }

    if (!hasConsent) {
      Alert.alert(
        "Consentement RGPD requis",
        "Vous devez donner votre consentement RGPD pour vous inscrire à cette formation.",
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Donner mon consentement", 
            onPress: () => {
              navigation.navigate('UserTabs');
              navigation.push('RGPD');
            }
          }
        ]
      );
      return;
    }

    navigation.navigate('InscriptionFormation', { 
      formationId: formation.id, 
      formationTitle: formation.title 
    });
  };

  const handleUnsubscribe = () => {
    if (!isDateValid) {
      Alert.alert(
        "Impossible de se désinscrire",
        "La formation commence dans moins de 2 jours ou est déjà passée. Contactez contact.esculappl@gmail.com pour toute modification."
      );
      return;
    }

    Alert.alert(
      "Confirmation",
      "Êtes-vous sûr de vouloir vous désinscrire de cette formation ?",
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: "Confirmer", 
          onPress: async () => {
            const user = auth.currentUser;
            if (user) {
              try {
                await update(ref_d(database, `/demandes/${user.uid}/${formationId}`), { 
                  admin: "désinscrit" 
                });
                setInscriptionStatus("désinscrit");
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
      `Vous allez être redirigé vers ${inscriptionURL}. Continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'OK',
          onPress: () => {
            Linking.openURL(inscriptionURL).catch(() => {
              Alert.alert('Erreur', `Impossible d'ouvrir le lien:\n${inscriptionURL}`);
            });
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    const toggleAction = formation.active ? "Désactiver" : "Réactiver";
    
    Alert.alert(
      "Confirmation",
      `Êtes-vous sûr de vouloir ${toggleAction.toLowerCase()} cette formation ?`,
      [
        { text: "Annuler", style: "cancel" },
        { 
          text: toggleAction, 
          onPress: async () => {
            try {
              const formationRef = ref_d(database, `/formations/${formationId}`);
              await set(formationRef, { ...formation, active: !formation.active });
              Alert.alert("Succès", `La formation a été ${toggleAction.toLowerCase()}e`);
              navigation.goBack();
            } catch (error) {
              Alert.alert("Erreur", "Impossible de modifier la formation");
            }
          }
        }
      ]
    );
  };

  const getButtonStyle = () => {
    if (!inscriptionStatus || inscriptionStatus === "désinscrit") {
      return styles.signUpButton;
    }
    return { ...styles.signUpButton, backgroundColor: '#808080' };
  };

  const getButtonText = () => {
    if (inscriptionFormat !== "Externe") {
      switch (inscriptionStatus) {
        case "en attente": return "Inscription en attente";
        case "Rejetée": return "Inscription rejetée";
        case "Validée": return "Se désinscrire";
        default: return "S'inscrire";
      }
    } else {
      return "S'inscrire en ligne";
    }
  };

  const handleButtonPress = () => {
    if (inscriptionFormat === "Externe") {
      handleExternalLink();
    } else if (inscriptionStatus === "Validée") {
      handleUnsubscribe();
    } else if (!inscriptionStatus || inscriptionStatus === "Rejetée" || inscriptionStatus === "désinscrit") {
      handleSignUp();
    }
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

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          {role.isAdmin ? (
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={getButtonStyle()}
                onPress={handleButtonPress}
              >
                <Text style={[
                  styles.signUpButtonText, 
                  inscriptionStatus === "Validée" ? { color: '#ff4444' } : null
                ]}>
                  {getButtonText()}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modifyButton}
                onPress={() => navigation.navigate('AjoutFormation', { formation, role })}
              >
                <Text style={styles.buttonText}>Modifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>
                  {formation.active ? "Désactiver" : "Réactiver"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            formation.active && (
              <TouchableOpacity 
                style={getButtonStyle()}
                onPress={handleButtonPress}
              >
                <Text style={[
                  styles.signUpButtonText, 
                  inscriptionStatus === "Validée" ? { color: '#ff4444' } : null
                ]}>
                  {getButtonText()}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Formation Details */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{new Date(formation.date).toLocaleDateString('fr-FR')} au {new Date(formation.date_de_fin).toLocaleDateString('fr-FR')}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Horaires</Text>
            <Text style={styles.infoValue}>{formation.heureDebut} à {formation.heureFin}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Lieu</Text>
            <Text style={styles.infoValue}>{formation.lieu}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tarif étudiant</Text>
            <Text style={styles.infoValue}>{formation.tarifEtudiant} €</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tarif médecin</Text>
            <Text style={styles.infoValue}>{formation.tarifMedecin} €</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{formation.description}</Text>
        </View>

        {/* Additional sections */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Prérequis</Text>
          <Text style={styles.description}>{formation.prerequis || "Non spécifié"}</Text>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>À savoir</Text>
          <Text style={styles.description}>{formation.instructions || "Non spécifié"}</Text>
        </View>

        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>Compétences acquises</Text>
          <Text style={styles.description}>{formation.competencesAcquises || "Non spécifié"}</Text>
        </View>

        {/* Formateur */}
        {formation.formateur && (
          <View style={styles.formateurSection}>
            <Text style={styles.sectionTitle}>Formateur</Text>
            <Text style={styles.formateur}>{formation.formateur}</Text>
          </View>
        )}
      </View>
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
    fontSize: 16,
    fontWeight: '600',
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
    flexDirection: 'row',
    gap: 12,
  },
  
  signUpButton: {
    backgroundColor: '#1a53ff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  
  modifyButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
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
  },

  // Info Grid
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
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
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