import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios"; // Import the axios library

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

  const uploadImage = async (uri, file_type, file_name) => {
    try {
      var imageData = {
         image: uri,
         type: file_type, //the mime type of the file
         name: file_name
       }
       
       const data = new FormData(); 
       data.append("image",uri)
       
      try{
        // const response = await axios.post("http://127.0.0.1:8000/api/uploadAndRemoveBackground", data);
        // call google.com just for check
        let res = await fetch(
          'https://bgrem.jayantkhanna.in/api/uploadAndRemoveBackground',
          {
            method: 'POST',
            body: data,
            // headers: {
            //   'Content-Type': 'multipart/form-data; ',
            // },
          }
        ).then((response) => response)
        .then((responseJson) => {
          console.log(responseJson);
        });
        console.log(res)
        let responseJson = await res.json();
        if (responseJson.status == 1) {
          console.log('Upload Successful');
        } else {
          console.log('Upload Failed');
        }
      }
      catch(error){
        console.log(error);
        console.log("error")
      }
      
      if (response.data.success) {
        // Assuming the backend sends the base64-encoded image content in the response
        const imageData = response.data.image;
        // Handle the received image data as needed (e.g., display it)
        setFile(`data:image/jpg;base64,${imageData}`);
      } else {
        setError("Failed to process the image. Please try again.");
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
