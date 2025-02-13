import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, Dimensions, Linking } from 'react-native';
import { auth, firebase, storage, database } from '../../firebase';
import { ref as ref_d, set, get, onValue, update } from 'firebase/database';
import RNPdf from 'react-native-pdf';


const FormationScreen = ({ route, navigation }) => {
  const { formationId, role } = route.params;
  const [formation, setFormation] = useState(null);
  const [inscriptionStatus, setInscriptionStatus] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [isDateValid, setIsDateValid] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [inscriptionFormat, setInscriptionFormat] = useState(null);
  const [inscriptionURL, setinscriptionURL] = useState('');
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
    console.log(formationId)
    const formationRef = ref_d(database, `/formations/${formationId}`);
    const unsubscribe = onValue(formationRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data)
      if (data) {
        setFormation(data);
        setInscriptionFormat(data.inscriptionStatus)
        if (data.inscriptionStatus === "Externe"){
          setinscriptionURL(data.inscriptionURL)
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
        const demandeRef = ref_d(database, `/demandes/${user.uid}/${formationId}`);
        const snapshot = await get(demandeRef);
        if (snapshot.exists()) {
          setInscriptionStatus(snapshot.val().admin);
        } else {
          setInscriptionStatus(null);
        }
      }
    };


    
    // Vérifier le consentement RGPD
    const checkConsent = async () => {
      const user = auth.currentUser;
      if (user) {
        const consentRef = ref_d(database, `/consentement/${user.uid}`);
        const snapshot = await get(consentRef);
        
        setHasConsent(snapshot.val() === true);
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

  const handleSignUp = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Erreur", "Vous devez être connecté pour vous inscrire.");
      return;
    }
    console.log('inscriptionStatus__ in handleSignup(): ', inscriptionStatus)
    if (inscriptionStatus == 'en attente') {
      Alert.alert(`Inscription ${inscriptionStatus}`, "Nous avons déjà une inscription de votre part. Pour plus d'informations sur votre inscription, contactez notre email d'assistance: contact.esculappl@gmail.com");
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
    navigation.navigate('InscriptionFormation', { formationId: formation.id, formationTitle: formation.title });
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
            await update(ref_d(database, `/demandes/${user.uid}/${formationId}`), { admin: "désinscrit" });

            
            setInscriptionStatus("désinscrit");
            Alert.alert("Succès", "Vous avez été désinscrit de la formation.");
          }
        }}
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
      <View style={styles.container}>
        <Text>Chargement...</Text>
      </View>
    );
  }


  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: formation.image }} style={styles.image} />
      <Text style={styles.title}>{formation.title}</Text>
      <Text style={styles.sectionTitle}>{formation.nature} de {formation.domaine}</Text>

      {(role.isAdmin === true) ? (
         <View style={styles.buttonContainer}>
         {/* {formation.active && ( */}
           <TouchableOpacity 
             style={getButtonStyle()}
             onPress={handleButtonPress}
            //  disabled={inscriptionStatus === "en attente"}
           >
             <Text style={[
               styles.signUpButtonText, 
               inscriptionStatus === "Validée" ? { color: 'red' } : null
             ]}>
               {getButtonText()}
             </Text>
           </TouchableOpacity>
         {/* )} */}
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
      ) : (
        <View style={styles.buttonContainer}>
         {formation.active && (
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
                       
         )}


        </View>
      )}

      <Text style={styles.info}>Date: {new Date(formation.date).toLocaleDateString('fr-FR')} au {new Date(formation.date_de_fin).toLocaleDateString('fr-FR')}</Text>
      <Text style={styles.info}>Horaires: {formation.heureDebut} à {formation.heureFin}</Text>
      <Text style={styles.info}>Lieu: {formation.lieu}</Text>

      <Text style={styles.info}>Tarif étudiant: {formation.tarifEtudiant} € / Tarif médecin: {formation.tarifMedecin} €</Text>
      
      <Text style={styles.sectionTitle}>Documentation PDF</Text>
      {/* <Text style={styles.label}>[ Cette version n'est pas adaptée au format Android ]</Text> */}
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
    padding: 15,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30, // Add extra padding at the bottom
  },
  // image: {
  //   width: '100%',
  //   // height: 200,
  //   marginBottom: 15,
  //   borderRadius: 10,
  // },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signUpButton: {
    backgroundColor: '#1a53ff',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  
  modifyButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  // new styles:
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f7fa',
  },
  image: {
    width: '100%',
    height: 250,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  programmeImage: {
    width: '100%',
    height: 210,
    marginBottom: 20,
    // borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 20,
    letterSpacing: 0.5,
    lineHeight: 32,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 10,
  },
  signUpButton: {
    backgroundColor: '#1a53ff',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modifyButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    elevation: 2,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    marginBottom: 12,
    color: '#34495e',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 25,
    marginBottom: 10,
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
    paddingBottom: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 15,
    color: '#34495e',
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  bottomSpacer: {
    height: 60,
  },
  // container2: {
  //   flex: 1,
  //   justifyContent: 'flex-start',
  //   alignItems: 'center',
  //   marginTop: 25,
  // },
  // pdf: {
  //     flex:1,
  //     width:Dimensions.get('window').width,
  //     height:Dimensions.get('window').height,
  // },
  pdfContainer: {
    width: '100%',
    height: 500, // Fixed height for PDF viewer
    marginVertical: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
  },
  yearsList: {
    paddingLeft: 10,
    marginTop: 5,
  },
  yearItem: {
    fontSize: 16,
    color: '#333',
    marginVertical: 3,
    lineHeight: 22,
  },
});

export default FormationScreen;