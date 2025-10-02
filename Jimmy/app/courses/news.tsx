import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, Image as ImageIcon, Video as VideoIcon, CreditCard, Clock } from 'lucide-react-native';
import { useCourse } from '@/contexts/CourseContext';
import { CATEGORIES, calculateCoursePrice } from '@/constants/course';

export default function NewCourseScreen() {
  const router = useRouter();
  const { createCourse, currentUserId, currentUserName } = useCourse();
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('technology');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [thumbnailUri, setThumbnailUri] = useState<string>('');
  const [videoUri, setVideoUri] = useState<string>('');
  const [idCardUri, setIdCardUri] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const pickThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant media library permission');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const pickVideo = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Video upload is not available on web. Please use the mobile app.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setVideoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };

  const pickIdCard = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant media library permission');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIdCardUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !durationMinutes || !idCardUri) {
      Alert.alert('Error', 'Please fill in all required fields and upload your ID card');
      return;
    }

    const duration = parseInt(durationMinutes);
    if (isNaN(duration) || duration < 1 || duration > 300) {
      Alert.alert('Error', 'Duration must be between 1 and 300 minutes');
      return;
    }

    const price = calculateCoursePrice(duration);

    Alert.alert(
      'Confirm Upload',
      `Your course will be priced at $${price.toFixed(2)} (${duration} minutes × $0.05/min). You will earn 80% ($${(price * 0.8).toFixed(2)}) per sale. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            setLoading(true);
            try {
              await createCourse({
                title: title.trim(),
                description: description.trim(),
                category,
                tags: [],
                durationMinutes: duration,
                thumbnailUri,
                videoUri,
                creatorId: currentUserId,
                creatorName: currentUserName,
              });
              Alert.alert('Success', 'Course uploaded successfully!', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error('Error creating course:', error);
              Alert.alert('Error', 'Failed to upload course');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const calculatedPrice = durationMinutes ? calculateCoursePrice(parseInt(durationMinutes) || 0) : 0;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Upload size={48} color="#fff" />
          <Text style={styles.title}>Upload Course</Text>
          <Text style={styles.subtitle}>Share your knowledge with the world</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Course Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter course title"
            placeholderTextColor="#888"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe what students will learn"
            placeholderTextColor="#888"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  category === cat.value && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.value && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Duration (minutes) *</Text>
          <View style={styles.durationContainer}>
            <Clock size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g., 45"
              placeholderTextColor="#888"
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="number-pad"
            />
          </View>
          {durationMinutes && (
            <View style={styles.priceInfo}>
              <Text style={styles.priceInfoText}>
                Course Price: ${calculatedPrice.toFixed(2)}
              </Text>
              <Text style={styles.priceInfoText}>
                Your Earnings: ${(calculatedPrice * 0.8).toFixed(2)} (80%)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Thumbnail Image</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickThumbnail}>
            {thumbnailUri ? (
              <Image source={{ uri: thumbnailUri }} style={styles.preview} />
            ) : (
              <>
                <ImageIcon size={32} color="#888" />
                <Text style={styles.uploadText}>Upload Thumbnail</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Video File</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickVideo}>
            {videoUri ? (
              <View style={styles.fileInfo}>
                <VideoIcon size={32} color="#fff" />
                <Text style={styles.fileName}>Video selected</Text>
              </View>
            ) : (
              <>
                <VideoIcon size={32} color="#888" />
                <Text style={styles.uploadText}>Upload Video</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>ID Card Verification *</Text>
          <Text style={styles.helperText}>
            Upload your service card to verify your identity and ensure quality content
          </Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickIdCard}>
            {idCardUri ? (
              <Image source={{ uri: idCardUri }} style={styles.preview} />
            ) : (
              <>
                <CreditCard size={32} color="#888" />
                <Text style={styles.uploadText}>Upload ID Card</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Upload Course</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categories: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#fff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#888',
  },
  categoryTextActive: {
    color: '#000',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  priceInfo: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  priceInfoText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
  },
  uploadButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  fileInfo: {
    alignItems: 'center',
  },
  fileName: {
    fontSize: 16,
    color: '#fff',
    marginTop: 12,
  },
  submitButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
});
