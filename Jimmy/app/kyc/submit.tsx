import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { User, Phone, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function KYCSubmitScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idCardUri, setIdCardUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setIdCardUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !phoneNumber.trim() || !idCardUri) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs et télécharger votre carte d\'identité');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(idCardUri);
      const blob = await response.blob();
      const filename = `kyc/${user.id}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      const idCardUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'kyc_requests'), {
        userId: user.id,
        userEmail: user.email || '',
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        idCardUrl,
        status: 'pending',
        submittedAt: Timestamp.now(),
      });

      Alert.alert(
        'Demande envoyée',
        'Votre demande de vérification a été envoyée. Vous recevrez une notification une fois qu\'elle sera examinée.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error submitting KYC:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer la demande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      padding: 20,
      paddingTop: insets.top + 20,
      paddingBottom: insets.bottom + 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: theme.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      marginBottom: 32,
      lineHeight: 24,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    icon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      height: 56,
      color: theme.text,
      fontSize: 16,
    },
    uploadButton: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      marginBottom: 16,
      borderWidth: 2,
      borderStyle: 'dashed' as const,
      borderColor: theme.border,
    },
    uploadButtonText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600' as const,
      marginTop: 8,
    },
    previewImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 16,
    },
    submitButton: {
      backgroundColor: theme.primary,
      height: 56,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '700' as const,
    },
    note: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 16,
      lineHeight: 20,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Vérification KYC</Text>
        <Text style={styles.subtitle}>
          Pour devenir créateur de contenu, vous devez vérifier votre identité en soumettant une carte d'identité valide.
        </Text>

        <View style={styles.inputContainer}>
          <User size={20} color={theme.textSecondary} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nom complet"
            placeholderTextColor={theme.textSecondary}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Phone size={20} color={theme.textSecondary} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Numéro de téléphone"
            placeholderTextColor={theme.textSecondary}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        {idCardUri ? (
          <Image source={{ uri: idCardUri }} style={styles.previewImage} />
        ) : null}

        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Upload size={32} color={theme.primary} />
          <Text style={styles.uploadButtonText}>
            {idCardUri ? 'Changer la carte d\'identité' : 'Télécharger la carte d\'identité'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Soumettre la demande</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          Votre demande sera examinée par notre équipe dans les 24-48 heures. Vous recevrez une notification par email.
        </Text>
      </ScrollView>
    </View>
  );
}
