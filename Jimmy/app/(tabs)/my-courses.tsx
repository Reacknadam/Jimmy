import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types/course';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play } from 'lucide-react-native';

export default function MyCoursesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (user.role === 'formateur') {
          const { data, error } = await supabase.from('courses').select('*').eq('creatorId', user.id).order('createdAt', { ascending: false });
          if (error) throw error;
          setCourses(data || []);
        } else if (user.role === 'utilisateur') {
          const { data: purchases, error: purchaseError } = await supabase.from('purchases').select('courseId').eq('userId', user.id);
          if (purchaseError) throw purchaseError;

          if (purchases && purchases.length > 0) {
            const courseIds = purchases.map(p => p.courseId);
            const { data, error: courseError } = await supabase.from('courses').select('*').in('id', courseIds);
            if (courseError) throw courseError;
            setCourses(data || []);
          } else {
            setCourses([]);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des cours:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const renderCourseItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseItem}
      onPress={() => {
        if (user?.role === 'utilisateur') {
          router.push({ pathname: '/courses/watch', params: { videoUrl: item.videoUrl, title: item.title } });
        }
        // Pour un formateur, la navigation est désactivée.
        // Idéalement, cela mènerait à un écran de gestion de cours.
      }}
      activeOpacity={user?.role === 'utilisateur' ? 0.7 : 1}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.courseCreator}>par {item.creatorName}</Text>
      </View>
      {user?.role === 'utilisateur' && (
        <View style={styles.playIcon}>
          <Play color={COLORS.text} size={24} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>Veuillez vous connecter pour voir vos cours.</Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Se connecter</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Mes Cours</Text>
      </View>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        renderItem={renderCourseItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              {user.role === 'formateur'
                ? "Vous n'avez encore créé aucun cours."
                : "Vous n'avez encore acheté aucun cours."}
            </Text>
            {user.role === 'formateur' && (
              <TouchableOpacity onPress={() => router.push('/courses/new')} style={styles.createButton}>
                <Text style={styles.createButtonText}>Créer mon premier cours</Text>
              </TouchableOpacity>
            )}
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
    padding: SIZES.padding,
  },
  header: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  list: {
    paddingHorizontal: SIZES.padding,
  },
  courseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.base * 1.5,
    marginBottom: SIZES.base * 1.5,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: SIZES.radius,
  },
  courseInfo: {
    flex: 1,
    marginLeft: SIZES.base * 1.5,
  },
  courseTitle: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  courseCreator: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
    marginTop: SIZES.base / 2,
  },
  playIcon: {
    marginLeft: 'auto',
    padding: SIZES.base,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
  },
  emptyText: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: SIZES.padding,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base * 1.5,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  loginButtonText: {
    ...FONTS.h3,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  createButton: {
    marginTop: SIZES.padding,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base * 1.5,
    paddingHorizontal: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  createButtonText: {
    ...FONTS.h3,
    color: COLORS.background,
    fontWeight: 'bold',
  },
});