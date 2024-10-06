import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import axios from 'react-native-axios';
import { launchImageLibrary } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { GoogleVisionApiKey } from './utils/GoogleVisionApiKey';

const DetectObject = () => {
  const [imageUri, setImageUri] = useState(null);
  const [labels, setLabels] = useState([]);
  const [selectedButton, setSelectedButton] = useState(null);

  const pickImage = async () => {
    try {
      launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.error) {
          console.log('ImagePicker Error: ', response.error);
        } else if (response.assets && response.assets.length > 0) {
          setImageUri(response.assets[0].uri);
        }
      });
    } catch (error) {
      console.error('Error picking image: ', error);
    }
  };

  const analyzeImage = async () => {
    try {
      if (!imageUri) {
        Alert.alert('Please select an image first!');
        return;
      }

      const apiKey = GoogleVisionApiKey.GoogleVisionApiKey1;
      const apiURL = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

      // Convert image to base64 format
      const base64ImageData = await RNFS.readFile(imageUri, 'base64');

      const requestData = {
        requests: [
          {
            image: { content: base64ImageData },
            features: [{ type: 'LABEL_DETECTION', maxResults: 5 }],
          },
        ],
      };

      const apiResponse = await axios.post(apiURL, requestData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (apiResponse.data.responses[0].labelAnnotations) {
        setLabels(apiResponse.data.responses[0].labelAnnotations);
      } else {
        Alert.alert('No labels found.');
      }
    } catch (error) {
      console.error('Error analyzing image: ', error);

      if (error.response) {
        console.error('Response data:', error.response.data);
        Alert.alert(`API Error: ${error.response.data.error.message}`);
      } else {
        Alert.alert('Network error or invalid request.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Made Using Google Cloud Vision API</Text>

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            selectedButton === 'pickImage' && styles.selectedButton,
          ]}
          onPress={() => {
            pickImage();
            setSelectedButton('pickImage');
          }}
        >
          <Text style={styles.buttonText}>Choose an Image</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            selectedButton === 'analyzeImage' && styles.selectedButton,
          ]}
          onPress={() => {
            analyzeImage();
            setSelectedButton('analyzeImage');
          }}
        >
          <Text style={styles.buttonText}>Analyze Image</Text>
        </TouchableOpacity>
      </View>

      {labels.length > 0 && (
        <View>
          <Text style={styles.resultText}>Detected Objects:</Text>
          {labels.map((label) => (
            <Text key={label.mid} style={styles.detectionText}>
              {label.description}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default DetectObject;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    width: 120,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#388E3C',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
    borderRadius: 10,
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  detectionText: {
    color: '#FFFFFF',
  },
});
