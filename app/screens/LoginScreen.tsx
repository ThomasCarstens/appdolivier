import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../../firebase';
import { ref as ref_d, onValue } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState({});
  const [uid, setUid] = useState('');

  useEffect(() => {
    auth.onAuthStateChanged(function(user) {
      checkCachedUser();
    });
  }, []);

  const checkCachedUser = async () => {
    try {
      const cachedUid = await AsyncStorage.getItem('userUid');
      console.log('cache:', cachedUid)
      if (cachedUid) {
        // User UID found in cache, check if still valid
        const user = auth.currentUser;

        if (user && user.uid === cachedUid) {
          // User is still logged in
          fetchUserRolesAndNavigate(cachedUid);
        } else {
          // Cached UID is no longer valid
          await AsyncStorage.removeItem('userUid');
          setLoading(false);
        }
      } else {
        // No cached UID found
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking cached user:', error);
      setLoading(false);
    }
  };

  const fetchUserRolesAndNavigate = (userId) => {
    const gameFileRef = ref_d(database, `userdata/${userId}`);
    
    onValue(gameFileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('Userdata downloaded:', data);
        setUserRoles(data);
        navigation.navigate('UserTabs', { userRoles: data, formateur: true, validated: 'true' });
      } else {
        // No user data found, log out and show login screen
        handleLogout();
      }
      setLoading(false);
    });
  };

  const handleLogin = () => {
    setLoading(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredentials) => {
        const user = userCredentials.user;
        console.log('Logged in with:', user.email);
        // Cache the user's UID
        await AsyncStorage.setItem('userUid', user.uid);
        fetchUserRolesAndNavigate(user.uid);
      })
      .catch(error => {
        alert(error.message);
        setLoading(false);
      });
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem('userUid');
      setLoading(false);
    } catch (error) {
      console.error('Error logging out:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />
      <Button title="Sign Up" onPress={() => navigation.navigate('Signup')} />
      <Button title="Reset Password" onPress={() => navigation.navigate('PasswordReset')} />
      <Button title="Background Info" onPress={() => navigation.navigate('BackgroundInfo')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});

export default LoginScreen;