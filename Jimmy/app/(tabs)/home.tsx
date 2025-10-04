import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types/course';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des cours :", error);
      } else {
        setCourses(data);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/courses/${item.id}`)}>
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.creator}>par {item.creatorName}</Text>
        <Text style={styles.price}>{item.price.toFixed(2)} €</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Découvrir</Text>
      </View>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseCard}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aucun cours disponible pour le moment.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
    paddingBottom: SIZES.base,
  },
  header: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  list: {
    paddingHorizontal: SIZES.padding / 2,
  },
  card: {
    flex: 1,
    margin: SIZES.base,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 120,
  },
  cardContent: {
    padding: SIZES.base * 1.5,
  },
  title: {
    ...FONTS.h4,
    color: COLORS.text,
    height: 44,
  },
  creator: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    marginVertical: SIZES.base / 2,
  },
  price: {
    ...FONTS.h3,
    color: COLORS.primary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  }
});