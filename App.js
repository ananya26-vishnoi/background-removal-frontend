import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export default function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permission to upload images.");
    } else {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 1,
        });
        
        // Check if the user cancelled the picker
        if (!result.canceled) {  // Note: newer versions use 'canceled' not 'cancelled'
          const imageUri = result.assets[0].uri;
          setFile(imageUri);
          setError(null);
          console.log("Selected image URI:", imageUri);
          
          // Send the image to the backend
          uploadImage(imageUri, 'image/jpeg', 'image.jpg');
        } else {
          console.log("Image picking cancelled");
        }
      } catch (err) {
        console.error("Error picking image:", err);
        setError("Error selecting image. Please try again.");
      }
    }
  };

  const downloadImage = async (imageUrl) => {
    try {
      // Extract filename from URL or use a default
      const fileName = imageUrl.split('/').pop() || 'downloaded-image.jpg';
      
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      console.log("Downloading image to:", fileUri);
      
      const { uri } = await FileSystem.downloadAsync(
        imageUrl,
        fileUri
      );

      // Request permission to save to Camera roll
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(uri);
        console.log('Image downloaded and saved to Camera roll successfully:', uri);
        Alert.alert("Success", "Image saved to your gallery");
      } else {
        console.warn('Media library permission not granted. Image saved within the app.');
        Alert.alert("Limited Access", "Image saved within the app only");
      }
      
      return uri;
    } catch (error) {
      console.error('Error downloading image:', error);
      setError("Failed to download the processed image");
      return null;
    }
  };

  const uploadImage = async (uri, fileType, fileName) => {
    console.log("Starting upload process for:", uri);
    
    try {
      const imageData = new FormData();
      imageData.append('image', {
        uri: uri,
        type: fileType || 'image/jpeg',
        name: fileName || 'image.jpg',
      });
      
      console.log("Sending request to backend...");
      
      try {
        const response = await fetch(
          'https://bgremover-backend.famsketch.eu/api/uploadAndRemoveBackground',
          {
            method: 'POST',
            body: imageData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        
        const responseJson = await response.json();
        console.log("Server response:", responseJson);
        
        if (responseJson.success) {
          // Handle base64 image response
          if (responseJson.image) {
            const base64Image = `data:image/jpeg;base64,${responseJson.image}`;
            setFile(base64Image);
            console.log("Received base64 image from server");
          } 
          
          // Handle URL response
          if (responseJson.url) {
            console.log("Downloading image from URL:", responseJson.url);
            await downloadImage(responseJson.url);
          }
        } else {
          setError(responseJson.message || "Failed to process the image. Please try again.");
        }
      } catch (error) {
        console.error("Network or server error:", error);
        setError("Server error. Please check your connection and try again.");
      }
    } catch (error) {
      console.error("Error preparing upload:", error.message);
      setError("Error uploading image. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add Image:</Text>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Choose Image</Text>
      </TouchableOpacity>

      {file ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: file }} style={styles.image} />
          <Text style={styles.successText}>Image selected successfully</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.placeholderText}>No image selected</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  header: {
    fontSize: 20,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorText: {
    color: "red",
    marginTop: 16,
  },
  successText: {
    color: "green",
    marginTop: 8,
  },
  placeholderText: {
    color: "#666",
    marginTop: 16,
  },
});