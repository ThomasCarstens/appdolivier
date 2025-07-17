import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  Linking,
  ActivityIndicator 
} from 'react-native';
import { auth, firebase, storage, database } from '../../firebase';
import { ref as ref_d, set, get, onValue, update } from 'firebase/database';
import { WebView } from 'react-native-webview';

const FormationScreen = ({ route, navigation }) => {
  const { formationId, role } = route.params;
  
  // State variables
  const [formation, setFormation] = useState(null);
  const [inscriptionStatus, setInscriptionStatus] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [isDateValid, setIsDateValid] = useState(true);
  const [inscriptionFormat, setInscriptionFormat] = useState(null);
  const [inscriptionURL, setInscriptionURL] = useState('');
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [webViewError, setWebViewError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

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

  // Helper function to extract YouTube video ID
  const extractYouTubeVideoId = (url) => {
    if (!url) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Main data loading effect
  useEffect(() => {
    const formationRef = ref_d(database, `/formations/${formationId}`);
    const unsubscribe = onValue(formationRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        setFormation(data);
        setInscriptionFormat(data.inscriptionStatus);
        
        if (data.videoUrl) {
          const videoId = extractYouTubeVideoId(data.videoUrl);
          setYoutubeVideoId(videoId);
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

  // WebView event handlers
  const onWebViewLoad = () => {
    setIsVideoLoading(false);
    setWebViewError(false);
  };

  const onWebViewError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView error:', nativeEvent);
    setWebViewError(true);
    setIsVideoLoading(false);
  };

  const onWebViewLoadStart = () => {
    setIsVideoLoading(true);
  };

  const createYouTubeHTML = (videoId) => {
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
              src="https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&showinfo=0&fs=1&autoplay=0"
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
        </body>
      </html>
    `;
  };

  // Registration handlers
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
        {youtubeVideoId && !webViewError ? (
          <View style={styles.videoWrapper}>
            <WebView
              style={styles.webView}
              source={{ html: createYouTubeHTML(youtubeVideoId) }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              onLoad={onWebViewLoad}
              onError={onWebViewError}
              onLoadStart={onWebViewLoadStart}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
              renderLoading={() => (
                <View style={styles.videoLoadingOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                  <Text style={styles.loadingVideoText}>Chargement de la vidéo...</Text>
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: formation.image }} 
              style={styles.image}
              resizeMode="cover"
            />
            {formation.videoUrl && webViewError && (
              <View style={styles.videoErrorOverlay}>
                <Text style={styles.videoErrorText}>
                  Erreur de chargement vidéo
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => {
                    setWebViewError(false);
                    setIsVideoLoading(true);
                  }}
                >
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}
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

        {/* Event Information Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Dates</Text>
            <Text style={styles.infoValue}>
              {new Date(formation.date).toLocaleDateString('fr-FR')} au{' '}
              {new Date(formation.date_de_fin).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Horaires</Text>
            <Text style={styles.infoValue}>
              {formation.heureDebut} - {formation.heureFin}
            </Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Lieu</Text>
            <Text style={styles.infoValue}>{formation.lieu}</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Tarifs</Text>
            <Text style={styles.infoValue}>
              Étudiant: {formation.tarifEtudiant}€
            </Text>
            <Text style={styles.infoValue}>
              Médecin: {formation.tarifMedecin}€
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <View style={styles.detailBlock}>
            <Text style={styles.sectionTitle}>Année conseillée</Text>
            {Array.isArray(formation.anneeConseillee) ? (
              <View style={styles.yearsList}>
                {formation.anneeConseillee.map((year, index) => (
                  <View key={index} style={styles.yearTag}>
                    <Text style={styles.yearText}>{year}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.detailText}>{formation.anneeConseillee}</Text>
            )}
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.sectionTitle}>Prérequis</Text>
            <Text style={styles.detailText}>
              {formation.prerequis || "Aucun prérequis spécifique"}
            </Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.sectionTitle}>Informations importantes</Text>
            <Text style={styles.detailText}>
              {formation.instructions || "Aucune information particulière"}
            </Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.sectionTitle}>Compétences acquises</Text>
            <Text style={styles.detailText}>
              {formation.competencesAcquises || "Non spécifié"}
            </Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.sectionTitle}>Affiliation DIU</Text>
            <Text style={styles.detailText}>
              {formation.affiliationDIU || "Non spécifié"}
            </Text>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.sectionTitle}>Documentation PDF</Text>
            <Text style={styles.noteText}>
              La visualisation PDF n'est pas encore optimisée pour cette version mobile.
            </Text>
          </View>
        </View>
      </View>

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

  // Media Section
  mediaContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
  },
  
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  
  webView: {
    width: '100%',
    height: '100%',
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
  
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  
  image: {
    width: '100%',
    height: '100%',
  },
  
  videoErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  
  videoErrorText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  retryButton: {
    backgroundColor: '#1a53ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Content Container
  contentContainer: {
    flex: 1,
  },

  // Header Section
  headerSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 34,
  },
  
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1a53ff',
  },

  // Button Section
  buttonSection: {
    padding: 24,
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
  
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
  },
  
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    lineHeight: 22,
  },

  // Details Section
  detailsSection: {
    padding: 24,
  },
  
  detailBlock: {
    marginBottom: 32,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  
  detailText: {
    fontSize: 16,
    color: '#4a4a4a',
    lineHeight: 24,
  },
  
  noteText: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  
  yearsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  yearTag: {
    backgroundColor: '#1a53ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  yearText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  
  bottomSpacer: {
    height: 24,
  },
});

export default FormationScreen;