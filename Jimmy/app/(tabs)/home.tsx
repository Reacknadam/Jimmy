import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types/course';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { CATEGORIES } from '@/constants/categories';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';

export default function HomeScreen() {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error("Erreur lors de la récupération des cours :", error);
      } else {
        setAllCourses(data);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allCourses, searchQuery, selectedCategory]);

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

      <View style={styles.searchContainer}>
        <Search size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un cours..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategory === 'all' && styles.categoryChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>Tous</Text>
          </TouchableOpacity>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.categoryChip, selectedCategory === cat.value && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat.value)}
            >
              <Text style={[styles.categoryText, selectedCategory === cat.value && styles.categoryTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCourses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseCard}
        numColumns={2}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Aucun cours ne correspond à votre recherche.</Text>
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