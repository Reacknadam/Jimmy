import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Download } from 'lucide-react-native';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export default function WatchScreen() {
  const { courseId, videoUrl, title } = useLocalSearchParams<{
    courseId: string;
    videoUrl: string;
    title: string;
  }>();
  const router = useRouter();
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleDownload = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Download is not available on web');
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant media library permission to download');
        return;
      }

      setDownloading(true);
      const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.mp4`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        videoUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log('Download progress:', progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      if (result) {
        await MediaLibrary.createAssetAsync(result.uri);
        Alert.alert('Success', 'Video downloaded successfully!');
      }
    } catch (error) {
      console.error('Error downloading video:', error);
      Alert.alert('Error', 'Failed to download video');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity
          onPress={handleDownload}
          disabled={downloading}
          style={styles.downloadButton}
        >
          <Download size={24} color={downloading ? '#888' : '#fff'} />
        </TouchableOpacity>
      </View>

      <Video
        source={{ uri: videoUrl }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginHorizontal: 16,
  },
  downloadButton: {
    padding: 8,
  },
  video: {
    flex: 1,
  },
});
