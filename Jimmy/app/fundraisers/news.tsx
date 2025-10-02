import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useFundraiser } from '@/contexts/FundraiserContext';
import * as ImagePicker from 'expo-image-picker';
import { X, ImageIcon, Sparkles } from 'lucide-react-native';
import { CATEGORIES } from '@/constants/fundraisers';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';

export default function NewFundraiserScreen() {
  const router = useRouter();
  const { createFundraiser } = useFundraiser();
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [category, setCategory] = useState('solidarity');
  const [imageUri, setImageUri] = useState<string | undefined>();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une description');
      return;
    }
    if (!goal || parseFloat(goal) <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un objectif valide');
      return;
    }

    setLoading(true);
    try {
      const result = await createFundraiser({
        title: title.trim(),
        description: description.trim(),
        goal: parseFloat(goal),
        category,
        tags: [],
        imageUri,
      });

      Alert.alert('Succès', 'Votre cagnotte a été créée avec succès', [
        {
          text: 'OK',
          onPress: () => router.replace(`/fundraisers/${result.id}`),
        },
      ]);
    } catch (error) {
      console.error('Error creating fundraiser:', error);
      Alert.alert('Erreur', 'Impossible de créer la cagnotte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Nouvelle cagnotte',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.cancelButton, { color: colors.tint }]}>Annuler</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Photo de couverture</Text>
          <TouchableOpacity 
            style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]} 
            onPress={pickImage}
          >
            {imageUri ? (
              <>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(undefined)}
                >
                  <X size={18} color="#FFFFFF" strokeWidth={2.5} />
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.imagePickerContent}>
                <LinearGradient
                  colors={[colors.gradient1 + '20', colors.gradient2 + '20']}
                  style={styles.imageIconContainer}
                >
                  <ImageIcon size={36} color={colors.tint} strokeWidth={2} />
                </LinearGradient>
                <Text style={[styles.imagePickerText, { color: colors.text }]}>Ajouter une photo</Text>
                <Text style={[styles.imagePickerHint, { color: colors.textTertiary }]}>
                  Recommandé: 16:9
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Titre</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border, 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text 
            }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Aide pour les frais médicaux"
            placeholderTextColor={colors.textTertiary}
            maxLength={100}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {title.length}/100
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { 
              borderColor: colors.border, 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text 
            }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez votre projet en détail..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Objectif (CDF)</Text>
          <TextInput
            style={[styles.input, { 
              borderColor: colors.border, 
              backgroundColor: colors.backgroundSecondary,
              color: colors.text 
            }]}
            value={goal}
            onChangeText={setGoal}
            placeholder="Ex: 100000"
            placeholderTextColor={colors.textTertiary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Catégorie</Text>
          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  { 
                    borderColor: category === cat.value ? colors.tint : colors.border,
                    backgroundColor: category === cat.value 
                      ? colors.tint 
                      : colors.backgroundSecondary
                  }
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    { color: category === cat.value ? '#FFFFFF' : colors.text }
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.gradient1, colors.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Sparkles size={22} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.submitButtonText}>Créer la cagnotte</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cancelButton: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  input: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 18,
    fontSize: 17,
    fontWeight: '500' as const,
  },
  textArea: {
    height: 160,
    paddingTop: 18,
  },
  charCount: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
    fontWeight: '600' as const,
  },
  imagePicker: {
    height: 220,
    borderRadius: 20,
    borderWidth: 3,
    borderStyle: 'dashed' as const,
    overflow: 'hidden',
  },
  imagePickerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  imageIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  imagePickerHint: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.8)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
});
