import React, { useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native'; // Icône pour fermer

export default function WatchScreen() {
  const { videoUrl, title } = useLocalSearchParams();
  const videoRef = useRef<Video>(null);
  const router = useRouter();

  if (typeof videoUrl !== 'string' || typeof title !== 'string') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erreur: Vidéo ou titre manquant.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: videoUrl }}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            // Optionnel: faire quelque chose quand la vidéo se termine
          }
        }}
      />
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X color="white" size={30} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  video: {
    flex: 1,
    alignSelf: 'stretch',
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
});