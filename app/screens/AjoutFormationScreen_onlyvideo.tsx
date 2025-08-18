import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as AuthSession from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';

const AjoutFormationScreen = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [accessToken, setAccessToken] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Google OAuth configuration
  const CLIENT_ID = '349759213253-mu3vsaaq17hk9t25aaad8ml0ppbvu780.apps.googleusercontent.com'; // Replace with your actual client ID
  const REDIRECT_URI = AuthSession.makeRedirectUri({
    scheme: 'com.googleusercontent.apps.349759213253-mu3vsaaq17hk9t25aaad8ml0ppbvu780', // Replace with your app scheme
  });

  // Google Drive API endpoints
  const DISCOVERY = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const authenticateWithGoogle = async () => {
    try {
      const request = new AuthSession.AuthRequest({
        clientId: CLIENT_ID,
        scopes: ['https://www.googleapis.com/auth/drive.file'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri: REDIRECT_URI,
        additionalParameters: {},
        prompt: AuthSession.Prompt.Consent,
      });

      const result = await request.promptAsync(DISCOVERY);

      if (result.type === 'success') {
        // Exchange code for access token
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: CLIENT_ID,
            code: result.params.code,
            redirectUri: REDIRECT_URI,
            extraParams: {
              code_verifier: request.codeVerifier,
            },
          },
          DISCOVERY
        );

        setAccessToken(tokenResponse.accessToken);
        Alert.alert('Success', 'Authenticated with Google Drive!');
        return tokenResponse.accessToken;
      } else {
        Alert.alert('Error', 'Authentication failed');
        return null;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Authentication failed');
      return null;
    }
  };

  const selectVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        setSelectedVideo(video);
        console.log('Selected video:', video);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const uploadToGoogleDrive = async () => {
    if (!selectedVideo) {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    let token = accessToken;
    if (!token) {
      token = await authenticateWithGoogle();
      if (!token) return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Read file as base64
      const fileContent = await FileSystem.readAsStringAsync(selectedVideo.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create metadata
      const metadata = {
        name: selectedVideo.name,
        parents: ['root'], // Upload to root folder, change as needed
      };

      // Create multipart upload body
      const delimiter = '-------314159265358979323846';
      const close_delim = `\r\n--${delimiter}--`;
      
      let body = `--${delimiter}\r\n`;
      body += 'Content-Type: application/json\r\n\r\n';
      body += JSON.stringify(metadata) + '\r\n';
      body += `--${delimiter}\r\n`;
      body += `Content-Type: ${selectedVideo.mimeType || 'video/mp4'}\r\n`;
      body += 'Content-Transfer-Encoding: base64\r\n\r\n';
      body += fileContent;
      body += close_delim;

      // Upload to Google Drive
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary="${delimiter}"`,
          },
          body: body,
        }
      );

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Success', `Video uploaded successfully!\nFile ID: ${result.id}`);
        setSelectedVideo(null);
        setUploadProgress(100);
      } else {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        Alert.alert('Error', 'Failed to upload video');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="cloud-upload-outline" size={60} color="#4285f4" />
        <Text style={styles.title}>Google Drive Video Upload</Text>
        <Text style={styles.subtitle}>
          Upload your videos directly to Google Drive
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Authentication</Text>
        <TouchableOpacity
          style={[
            styles.button,
            accessToken ? styles.buttonSuccess : styles.buttonPrimary
          ]}
          onPress={authenticateWithGoogle}
          disabled={uploading}
        >
          <Ionicons 
            name={accessToken ? "checkmark-circle" : "log-in-outline"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.buttonText}>
            {accessToken ? 'Authenticated ✓' : 'Authenticate with Google'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Video</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={selectVideo}
          disabled={uploading}
        >
          <Ionicons name="videocam-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Choose Video File</Text>
        </TouchableOpacity>

        {selectedVideo && (
          <View style={styles.fileInfo}>
            <Ionicons name="document-outline" size={24} color="#666" />
            <View style={styles.fileDetails}>
              <Text style={styles.fileName}>{selectedVideo.name}</Text>
              <Text style={styles.fileSize}>
                {formatFileSize(selectedVideo.size)}
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upload</Text>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSuccess,
            (!selectedVideo || !accessToken || uploading) && styles.buttonDisabled
          ]}
          onPress={uploadToGoogleDrive}
          disabled={!selectedVideo || !accessToken || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={20} color="white" />
          )}
          <Text style={styles.buttonText}>
            {uploading ? 'Uploading...' : 'Upload to Google Drive'}
          </Text>
        </TouchableOpacity>

        {uploading && uploadProgress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${uploadProgress}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Setup Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Replace YOUR_GOOGLE_CLIENT_ID with your actual Google OAuth client ID{'\n'}
          2. Replace 'your-app-scheme' with your app's URL scheme{'\n'}
          3. Install required dependencies:{'\n'}
          • expo install expo-document-picker{'\n'}
          • expo install expo-file-system{'\n'}
          • expo install expo-auth-session{'\n'}
          • expo install expo-crypto
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonPrimary: {
    backgroundColor: '#4285f4',
  },
  buttonSecondary: {
    backgroundColor: '#34a853',
  },
  buttonSuccess: {
    backgroundColor: '#0f9d58',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  fileSize: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4285f4',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  instructions: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#856404',
  },
  instructionsText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default AjoutFormationScreen;