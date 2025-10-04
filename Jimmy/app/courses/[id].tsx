import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types/course';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', String(id))
        .single();

      if (error) {
        console.error("Erreur lors de la récupération du cours :", error);
        Alert.alert("Erreur", "Impossible de charger les détails du cours.");
      } else {
        setCourse(data);
      }
      setLoading(false);
    };

    fetchCourse();
  }, [id]);

  const handlePurchase = async () => {
    if (!user) {
      Alert.alert("Connexion requise", "Vous devez vous connecter pour acheter un cours.", [
        { text: "Annuler", style: "cancel" },
        { text: "Se connecter", onPress: () => router.push('/auth/login') }
      ]);
      return;
    }

    if (!course) return;
    setIsPurchasing(true);

    try {
      const { data: existingPurchase, error: checkError } = await supabase
        .from('purchases')
        .select('id')
        .eq('userId', user.id)
        .eq('courseId', course.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;

      if (existingPurchase) {
        Alert.alert("Déjà acquis", "Vous possédez déjà ce cours. Vous le trouverez dans \"Mes Cours\".");
        router.push('/(tabs)/my-courses');
        return;
      }

      const { error: insertError } = await supabase.from('purchases').insert({
        userId: user.id,
        courseId: course.id,
      });

      if (insertError) throw insertError;

      Alert.alert("Achat réussi !", `Vous pouvez maintenant accéder à "${course.title}" depuis "Mes Cours".`);
      router.push('/(tabs)/my-courses');

    } catch (error) {
      console.error("Erreur lors de l'achat :", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de l'achat. Veuillez réessayer.");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Cours introuvable.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: course.title, headerStyle: { backgroundColor: COLORS.surface }, headerTintColor: COLORS.text, headerTitleStyle: { color: COLORS.text } }} />
      <ScrollView>
        <Image source={{ uri: course.thumbnailUrl }} style={styles.thumbnail} />
        <View style={styles.content}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.creator}>Créé par {course.creatorName}</Text>

          <View style={styles.separator} />

          <Text style={styles.descriptionHeader}>À propos de ce cours</Text>
          <Text style={styles.description}>{course.description}</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.price}>{course.price.toFixed(2)} €</Text>
        <TouchableOpacity style={[styles.button, isPurchasing && styles.buttonDisabled]} onPress={handlePurchase} disabled={isPurchasing}>
          {isPurchasing ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.buttonText}>Acheter ce cours</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
  thumbnail: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: SIZES.padding,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  creator: {
    ...FONTS.h3,
    color: COLORS.textSecondary,
    marginBottom: SIZES.padding,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.padding,
  },
  descriptionHeader: {
    ...FONTS.h2,
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  description: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  price: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base * 1.5,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  buttonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  buttonText: {
    ...FONTS.h3,
    color: COLORS.background,
    fontWeight: 'bold',
  },
});