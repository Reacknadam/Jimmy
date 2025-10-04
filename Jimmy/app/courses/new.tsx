import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Upload, Video as VideoIcon } from 'lucide-react-native';

export default function NewCourseScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [thumbnail, setThumbnail] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [video, setVideo] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const selectThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setThumbnail(result.assets[0]);
    }
  };

  const selectVideo = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
    });

    if (result.canceled === false) {
      setVideo(result.assets[0]);
    }
  };

  const handlePublish = async () => {
    if (!title || !description || !price || !thumbnail || !video || !user) {
      Alert.alert('Champs incomplets', 'Veuillez remplir tous les champs et sélectionner une miniature ainsi qu\'une vidéo.');
      return;
    }

    setLoading(true);

    try {
      const thumbnailUrl = await uploadFile(thumbnail.uri, `thumbnails/${user.id}-${Date.now()}`);
      const videoUrl = await uploadFile(video.uri, `videos/${user.id}-${Date.now()}`);

      const { error } = await supabase.from('courses').insert({
        title,
        description,
        price: parseFloat(price.replace(',', '.')),
        thumbnailUrl,
        videoUrl,
        creatorId: user.id,
        creatorName: user.fullName,
      });

      if (error) throw error;

      Alert.alert('Succès', 'Votre cours a été publié avec succès !');
      router.back();
    } catch (error) {
      console.error('Erreur lors de la publication du cours:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la publication de votre cours.');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (uri: string, path: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Nouveau cours', headerStyle: { backgroundColor: COLORS.surface }, headerTintColor: COLORS.text, headerTitleStyle: { color: COLORS.text } }} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.label}>Titre du cours</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Introduction à React Native" placeholderTextColor={COLORS.textSecondary} />

        <Text style={styles.label}>Description</Text>
        <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Décrivez en détail le contenu de votre cours" multiline numberOfLines={4} placeholderTextColor={COLORS.textSecondary} />

        <Text style={styles.label}>Prix (€)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Ex: 99,99" keyboardType="numeric" placeholderTextColor={COLORS.textSecondary} />

        <TouchableOpacity style={styles.uploadButton} onPress={selectThumbnail}>
          <Upload color={COLORS.primary} size={24} />
          <Text style={styles.uploadButtonText}>{thumbnail ? 'Changer la miniature' : 'Choisir une miniature'}</Text>
        </TouchableOpacity>
        {thumbnail && <Text style={styles.fileName} numberOfLines={1}>{thumbnail.fileName || thumbnail.uri.split('/').pop()}</Text>}

        <TouchableOpacity style={styles.uploadButton} onPress={selectVideo}>
          <VideoIcon color={COLORS.primary} size={24} />
          <Text style={styles.uploadButtonText}>{video ? 'Changer la vidéo' : 'Choisir une vidéo'}</Text>
        </TouchableOpacity>
        {video && <Text style={styles.fileName} numberOfLines={1}>{video.name}</Text>}

      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.publishButton, loading && styles.publishButtonDisabled]} onPress={handlePublish} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.publishButtonText}>Publier le cours</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { padding: SIZES.padding },
  label: { ...FONTS.h4, color: COLORS.text, marginTop: SIZES.padding, marginBottom: SIZES.base },
  input: { ...FONTS.body3, backgroundColor: COLORS.surface, color: COLORS.text, padding: SIZES.padding, borderRadius: SIZES.radius, textAlignVertical: 'top' },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SIZES.padding, borderRadius: SIZES.radius, marginTop: SIZES.padding },
  uploadButtonText: { ...FONTS.h4, color: COLORS.primary, marginLeft: SIZES.base },
  fileName: { ...FONTS.body4, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.base, fontStyle: 'italic' },
  footer: { padding: SIZES.padding, borderTopWidth: 1, borderTopColor: COLORS.border },
  publishButton: { backgroundColor: COLORS.primary, padding: SIZES.padding, borderRadius: SIZES.radius, alignItems: 'center' },
  publishButtonDisabled: { backgroundColor: COLORS.textSecondary },
  publishButtonText: { ...FONTS.h3, color: COLORS.background, fontWeight: 'bold' },
});