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
      const result = await ImagePicker.launchImageLibraryAsync();

      if (!result.cancelled) {
        setFile(result.uri);
        setError(null);

        // Send the image to the backend
        uploadImage(result.assets[0].uri, result.assets[0].type, result.assets[0].fileName);

      }
    }
  };

  const downloadImage = async (imageUrl) => {
    try {
      const { uri, name } = await FileSystem.downloadAsync(
        imageUrl,
        FileSystem.documentDirectory + name // Download to document directory
      );

      // Move the downloaded image to a publicly accessible location (e.g., Camera roll)
      const newUri = await FileSystem.moveAsync({
        from: uri,
        to: `${FileSystem.documentDirectory}${name}`, // Move within the app's directory
      });

      // Request permission to save to Camera roll (optional)
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        await MediaLibrary.saveToLibraryAsync(newUri); // Save to Camera roll
        console.log('Image downloaded and saved to Camera roll successfully:', newUri);
      } else {
        console.warn('Media library permission not granted. Image saved within the app.');
      }
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };


  function getExtension(url) {
    // Helper function to extract file extension (optional)
    const parts = url.split('.');
    return parts[parts.length - 1];
  }

  const uploadImage = async (uri, file_type, file_name) => {
    try {

      const imageData = new FormData();
      imageData.append('image', {
        uri: uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      });
      imageData.append('file_type', file_type);

      try {
        // const response = await axios.post("http://127.0.0.1:8000/api/uploadAndRemoveBackground", data);
        // call google.com just for check
        let res = await fetch(
          'http://192.168.1.3:8520/api/uploadAndRemoveBackground',
          {
            method: 'POST',
            body: imageData,
          }
        ).then((response) => response.json())
          .then(async (responseJson) => {
            if (responseJson.success) {
              // Assuming the backend sends the base64-encoded image content in the response
              const resImageData = responseJson.image;
              setFile(`data:image/jpg;base64,${resImageData}`);

              // Download file here form this url
              url = responseJson.url
              try {
                await downloadImage(url);
                console.log('Image downloaded successfully!'); // Add success handling if needed
              } catch (error) {
                console.error('Error downloading image:', error);
              }

            }
            else {
              setError("Failed to process the image. Please try again.");
            }
          });
      }
      catch (error) {
        console.log(error);
        console.log("error")
      }

    } catch (error) {
      console.error("Error uploading image:", error.message);
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
        </View>
      ) : (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
}

// Styles remain unchanged
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
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  errorText: {
    color: "red",
    marginTop: 16,
  },
});
