import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Clock, Users, Play, MessageCircle, Send } from 'lucide-react-native';
import { useCourse } from '@/contexts/CourseContext';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Course, Purchase } from '@/types/course';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { incrementView, createComment, createRating, currentUserId, currentUserName } = useCourse();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasPurchased, setHasPurchased] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sendingComment, setSendingComment] = useState<boolean>(false);

  useEffect(() => {
    loadCourse();
    checkPurchaseStatus();
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;
    try {
      const docRef = doc(db, 'courses', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const courseData = { id: docSnap.id, ...docSnap.data() } as Course;
        setCourse(courseData);
        await incrementView(id);
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!id || currentUserId === 'anonymous') return;
    try {
      const q = query(
        collection(db, 'purchases'),
        where('courseId', '==', id),
        where('buyerId', '==', currentUserId),
        where('status', '==', 'success')
      );
      const snapshot = await getDocs(q);
      setHasPurchased(!snapshot.empty);
    } catch (error) {
      console.error('Error checking purchase:', error);
    }
  };

  const handlePurchase = () => {
    if (!course) return;
    router.push({
      pathname: '/courses/purchase',
      params: {
        courseId: course.id,
        courseName: course.title,
        price: course.price.toString(),
        creatorId: course.creatorId,
      },
    } as any);
  };

  const handleWatch = () => {
    if (!course) return;
    router.push({
      pathname: '/courses/watch',
      params: {
        courseId: course.id,
        videoUrl: course.videoUrl,
        title: course.title,
      },
    } as any);
  };

  const handleSendComment = async () => {
    if (!course || !comment.trim()) return;
    setSendingComment(true);
    try {
      await createComment({
        courseId: course.id,
        creatorId: course.creatorId,
        message: comment.trim(),
      });
      setComment('');
      Alert.alert('Success', 'Your message has been sent to the creator');
    } catch (error) {
      console.error('Error sending comment:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingComment(false);
    }
  };

  const handleRating = async (rating: number) => {
    if (!course) return;
    setSelectedRating(rating);
    try {
      await createRating({
        courseId: course.id,
        rating,
      });
      Alert.alert('Success', 'Thank you for your rating!');
      await loadCourse();
    } catch (error) {
      console.error('Error rating course:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Course not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: course.thumbnailUrl }} style={styles.coverImage} />
        
        <View style={styles.content}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.creator}>by {course.creatorName}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Clock size={18} color="#888" />
              <Text style={styles.statText}>{course.durationMinutes} min</Text>
            </View>
            <View style={styles.statItem}>
              <Star size={18} color="#FFB800" fill="#FFB800" />
              <Text style={styles.statText}>
                {course.averageRating > 0 ? course.averageRating.toFixed(1) : 'New'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Users size={18} color="#888" />
              <Text style={styles.statText}>{course.totalPurchases} students</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>${course.price.toFixed(2)}</Text>
            <Text style={styles.priceNote}>
              ${(course.price / course.durationMinutes).toFixed(2)}/min
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this course</Text>
            <Text style={styles.description}>{course.description}</Text>
          </View>

          {hasPurchased && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rate this course</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRating(star)}
                    style={styles.starButton}
                  >
                    <Star
                      size={32}
                      color="#FFB800"
                      fill={star <= selectedRating ? '#FFB800' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Message the creator</Text>
            <Text style={styles.sectionSubtitle}>
              Send a private message directly to {course.creatorName}
            </Text>
            <View style={styles.commentContainer}>
              <MessageCircle size={20} color="#888" style={styles.commentIcon} />
              <TextInput
                style={styles.commentInput}
                placeholder="Write your message..."
                placeholderTextColor="#888"
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                onPress={handleSendComment}
                disabled={!comment.trim() || sendingComment}
                style={styles.sendButton}
              >
                {sendingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={20} color={comment.trim() ? '#fff' : '#888'} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {hasPurchased ? (
          <TouchableOpacity style={styles.watchButton} onPress={handleWatch}>
            <Play size={24} color="#000" fill="#000" />
            <Text style={styles.watchButtonText}>Watch Course</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
            <Text style={styles.purchaseButtonText}>Purchase for ${course.price.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    fontSize: 16,
    color: '#888',
  },
  coverImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  creator: {
    fontSize: 16,
    color: '#888',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#888',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
  },
  priceNote: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  commentIcon: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  purchaseButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
  watchButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  watchButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#000',
  },
});
