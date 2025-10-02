import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Play, Clock, Plus } from 'lucide-react-native';
import { useCourse } from '@/contexts/CourseContext';
import { query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Course, Purchase } from '@/types/course';

export default function MyCoursesScreen() {
  const router = useRouter();
  const { currentUserId } = useCourse();
  const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([]);
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'purchased' | 'created'>('purchased');

  useEffect(() => {
    loadCourses();
  }, [currentUserId]);

  const loadCourses = async () => {
    if (currentUserId === 'anonymous') {
      setLoading(false);
      return;
    }

    try {
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('buyerId', '==', currentUserId),
        where('status', '==', 'success')
      );
      const purchasesSnapshot = await getDocs(purchasesQuery);
      const purchases = purchasesSnapshot.docs.map(doc => doc.data() as Purchase);

      const courseIds = purchases.map(p => p.courseId);
      const coursesData: Course[] = [];
      
      for (const courseId of courseIds) {
        const courseQuery = query(
          collection(db, 'courses'),
          where('__name__', '==', courseId)
        );
        const courseSnapshot = await getDocs(courseQuery);
        if (!courseSnapshot.empty) {
          const courseDoc = courseSnapshot.docs[0];
          coursesData.push({ id: courseDoc.id, ...courseDoc.data() } as Course);
        }
      }
      setPurchasedCourses(coursesData);

      const createdQuery = query(
        collection(db, 'courses'),
        where('creatorId', '==', currentUserId)
      );
      const createdSnapshot = await getDocs(createdQuery);
      const created = createdSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setCreatedCourses(created);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWatch = (course: Course) => {
    router.push({
      pathname: '/courses/watch',
      params: {
        courseId: course.id,
        videoUrl: course.videoUrl,
        title: course.title,
      },
    } as any);
  };

  const handleViewCourse = (courseId: string) => {
    router.push(`/courses/${courseId}` as any);
  };

  const renderCourseCard = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => activeTab === 'purchased' ? handleWatch(item) : handleViewCourse(item.id)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
      <View style={styles.playOverlay}>
        <Play size={32} color="#fff" fill="#fff" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.creatorName} numberOfLines={1}>
          {item.creatorName}
        </Text>
        <View style={styles.courseInfo}>
          <Clock size={14} color="#888" />
          <Text style={styles.infoText}>{item.durationMinutes} min</Text>
        </View>
        {activeTab === 'created' && (
          <View style={styles.stats}>
            <Text style={styles.statText}>{item.totalPurchases} sales</Text>
            <Text style={styles.statText}>{item.totalViews} views</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const courses = activeTab === 'purchased' ? purchasedCourses : createdCourses;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Courses</Text>
        {activeTab === 'created' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/courses/new' as any)}
          >
            <Plus size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchased' && styles.tabActive]}
          onPress={() => setActiveTab('purchased')}
        >
          <Text style={[styles.tabText, activeTab === 'purchased' && styles.tabTextActive]}>
            Purchased
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'created' && styles.tabActive]}
          onPress={() => setActiveTab('created')}
        >
          <Text style={[styles.tabText, activeTab === 'created' && styles.tabTextActive]}>
            Created
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === 'purchased'
              ? 'No purchased courses yet'
              : 'No created courses yet'}
          </Text>
          {activeTab === 'created' && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/courses/new' as any)}
            >
              <Text style={styles.createButtonText}>Create Your First Course</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={courses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#888',
  },
  tabTextActive: {
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  courseCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    backgroundColor: '#2a2a2a',
  },
  playOverlay: {
    position: 'absolute',
    top: 40,
    left: '50%',
    marginLeft: -16,
    opacity: 0.9,
  },
  cardContent: {
    padding: 12,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
    marginBottom: 4,
    height: 36,
  },
  creatorName: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
    color: '#888',
  },
});
