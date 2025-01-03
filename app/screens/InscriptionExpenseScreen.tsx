import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';

const PartnerSignupScreen = () => {
  const handleVisit = () => {
    Linking.openURL('http://www.sofmmoom.org');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('../../assets/images/partenaires/sofMOMMO.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>SOFMMOOM</Text>
        <Text style={styles.subtitle}>
          Société Française de Médecine Manuelle Orthopédique et Ostéopathique Médicale
        </Text>
        
        <Text style={styles.instructions}>
          Pour s'inscrire à nos formations, veuillez vous inscrire directement sur notre site web officiel.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleVisit}>
          <Text style={styles.buttonText}>Accéder au site</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a53ff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#1a53ff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PartnerSignupScreen;