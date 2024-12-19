import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Permissions from 'expo-permissions';

export default function App() {
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Microphone permission is required to record audio.');
    }
    return status === 'granted';
  };

  // Start recording
  const startRecording = async () => {
    const granted = await requestPermissions();
    if (!granted) return;

    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  };

  // Stop recording
  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const newRecording = {
        id: Date.now().toString(),
        uri,
        date: new Date().toLocaleString(),
      };
      const updatedRecordings = [...recordings, newRecording];
      setRecordings(updatedRecordings);
      await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
      setRecording(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  };

  // Play a recording
  const playRecording = async (uri) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play recording', error);
    }
  };

  // Delete a recording
  const deleteRecording = async (id) => {
    const updatedRecordings = recordings.filter((rec) => rec.id !== id);
    setRecordings(updatedRecordings);
    await AsyncStorage.setItem('recordings', JSON.stringify(updatedRecordings));
  };

  const renderItem = ({ item }) => (
    <View style={styles.recordingItem}>
      <Text style={styles.recordingText}>{item.date}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => playRecording(item.uri)} style={styles.playButton}>
          <Text style={styles.buttonText}>Play</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteRecording(item.id)} style={styles.deleteButton}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Audio Recorder</Text>
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity
        onPress={isRecording ? stopRecording : startRecording}
        style={isRecording ? styles.stopButton : styles.recordButton}
      >
        <Text style={styles.buttonText}>{isRecording ? 'Stop' : 'Record'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF0',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4500',
    textAlign: 'center',
    marginVertical: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  recordingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF5EE',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    borderColor: '#FF4500',
    borderWidth: 1,
  },
  recordingText: {
    color: '#333',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  playButton: {
    backgroundColor: '#FFA07A',
    padding: 8,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: '#FF6347',
    padding: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  recordButton: {
    backgroundColor: '#FF4500',
    padding: 16,
    borderRadius: 50,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 16,
  },
  stopButton: {
    backgroundColor: '#FF6347',
    padding: 16,
    borderRadius: 50,
    alignSelf: 'center',
    position: 'absolute',
    bottom: 16,
  },
});
