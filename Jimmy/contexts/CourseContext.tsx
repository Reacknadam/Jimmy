import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  onSnapshot,
  Timestamp,
  getDoc,
  getDocs,
  where,
  increment,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { Course, Purchase, Comment, Rating, PlatformConfig, CreatorStats, PurchaseStatus, DownloadedCourse } from '@/types/course';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useState, useEffect } from 'react';

import { calculateCoursePrice, calculateCreatorEarnings } from '@/constants/course';

export const [CourseProvider, useCourse] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string>('anonymous');
  const [currentUserName, setCurrentUserName] = useState<string>('Utilisateur');
  const [downloadedCourses, setDownloadedCourses] = useState<DownloadedCourse[]>([]);

  useEffect(() => {
    loadDownloadedCourses();
  }, []);

  const loadDownloadedCourses = async () => {
    try {
      const stored = await AsyncStorage.getItem('@downloaded_courses');
      if (stored) {
        setDownloadedCourses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading downloaded courses:', error);
    }
  };

  const saveDownloadedCourses = async (courses: DownloadedCourse[]) => {
    try {
      await AsyncStorage.setItem('@downloaded_courses', JSON.stringify(courses));
      setDownloadedCourses(courses);
    } catch (error) {
      console.error('Error saving downloaded courses:', error);
    }
  };

  const configQuery = useQuery({
    queryKey: ['platform-config'],
    queryFn: async (): Promise<PlatformConfig> => {
      const docRef = doc(db, 'public', 'platform_config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as PlatformConfig;
      }
      return {
        platformFeePercent: 20,
        pricePerMinute: 0.05,
        currency: 'USD',
        minCourseDuration: 1,
        maxCourseDuration: 300,
      };
    },
  });

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: async (): Promise<Course[]> => {
      const q = query(
        collection(db, 'courses'),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(q);
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      
      return courses.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
    },
  });

  useEffect(() => {
    const q = query(
      collection(db, 'courses'),
      where('isActive', '==', true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      
      const sortedCourses = courses.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });
      
      queryClient.setQueryData(['courses'], sortedCourses);
    });

    return () => unsubscribe();
  }, [queryClient]);

  const createCourseMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      category: string;
      tags: string[];
      durationMinutes: number;
      thumbnailUri?: string;
      videoUri?: string;
      creatorId: string;
      creatorName: string;
    }) => {
      let thumbnailUrl = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800';
      let videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

      if (data.thumbnailUri) {
        const response = await fetch(data.thumbnailUri);
        const blob = await response.blob();
        const filename = `courses/thumbnails/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        thumbnailUrl = await getDownloadURL(storageRef);
      }

      if (data.videoUri) {
        const response = await fetch(data.videoUri);
        const blob = await response.blob();
        const filename = `courses/videos/${Date.now()}.mp4`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        videoUrl = await getDownloadURL(storageRef);
      }

      const price = calculateCoursePrice(data.durationMinutes);

      const course: Omit<Course, 'id'> = {
        title: data.title,
        description: data.description,
        thumbnailUrl,
        videoUrl,
        durationMinutes: data.durationMinutes,
        price,
        currency: configQuery.data?.currency || 'USD',
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        category: data.category as any,
        tags: data.tags,
        isActive: true,
        totalViews: 0,
        totalPurchases: 0,
        averageRating: 0,
        totalRatings: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'courses'), course);
      return { id: docRef.id, ...course };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const createPurchaseMutation = useMutation({
    mutationFn: async (data: {
      courseId: string;
      courseName: string;
      amount: number;
      buyerName: string;
      buyerPhone: string;
      depositId?: string;
    }) => {
      const purchase: Omit<Purchase, 'id'> = {
        courseId: data.courseId,
        courseName: data.courseName,
        buyerId: currentUserId,
        buyerName: data.buyerName,
        buyerEmail: '',
        amount: data.amount,
        currency: 'CDF',
        paymentMethod: 'pawapay',
        depositId: data.depositId,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'purchases'), purchase);
      return { id: docRef.id, ...purchase, depositId: data.depositId || '' };
    },
  });

  const updatePurchaseStatusMutation = useMutation({
    mutationFn: async (data: { 
      purchaseId: string; 
      status: PurchaseStatus;
      courseId: string;
      creatorId: string;
      amount: number;
    }) => {
      const batch = writeBatch(db);

      const purchaseRef = doc(db, 'purchases', data.purchaseId);
      batch.update(purchaseRef, {
        status: data.status,
        updatedAt: Timestamp.now(),
      });

      if (data.status === 'success') {
        const courseRef = doc(db, 'courses', data.courseId);
        batch.update(courseRef, {
          totalPurchases: increment(1),
          updatedAt: Timestamp.now(),
        });

        const creatorRef = doc(db, 'creators', data.creatorId);
        const earnings = calculateCreatorEarnings(data.amount);
        batch.update(creatorRef, {
          totalEarnings: increment(earnings),
          totalStudents: increment(1),
          updatedAt: Timestamp.now(),
        });
      }

      await batch.commit();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['creator-stats'] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data: {
      courseId: string;
      creatorId: string;
      message: string;
    }) => {
      const comment: Omit<Comment, 'id'> = {
        courseId: data.courseId,
        creatorId: data.creatorId,
        senderId: currentUserId,
        senderName: currentUserName,
        message: data.message,
        isRead: false,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'comments'), comment);
      return { id: docRef.id, ...comment };
    },
  });

  const createRatingMutation = useMutation({
    mutationFn: async (data: {
      courseId: string;
      rating: number;
    }) => {
      const ratingDoc: Omit<Rating, 'id'> = {
        courseId: data.courseId,
        userId: currentUserId,
        userName: currentUserName,
        rating: data.rating,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'ratings'), ratingDoc);

      const ratingsQuery = query(
        collection(db, 'ratings'),
        where('courseId', '==', data.courseId)
      );
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data().rating as number);
      const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

      const courseRef = doc(db, 'courses', data.courseId);
      await updateDoc(courseRef, {
        averageRating,
        totalRatings: ratings.length,
        updatedAt: Timestamp.now(),
      });

      return { id: docRef.id, ...ratingDoc };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const incrementViewMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        totalViews: increment(1),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const getCreatorStats = async (creatorId: string): Promise<CreatorStats> => {
    console.log('Fetching stats for creator:', creatorId);
    const coursesQuery = query(
      collection(db, 'courses'),
      where('creatorId', '==', creatorId)
    );
    const coursesSnapshot = await getDocs(coursesQuery);
    const courses = coursesSnapshot.docs.map(doc => doc.data() as Course);

    const totalViews = courses.reduce((sum, course) => sum + course.totalViews, 0);
    const totalPurchases = courses.reduce((sum, course) => sum + course.totalPurchases, 0);

    const purchasesQuery = query(
      collection(db, 'purchases'),
      where('status', '==', 'success')
    );
    const purchasesSnapshot = await getDocs(purchasesQuery);
    const purchases = purchasesSnapshot.docs.map(doc => doc.data() as Purchase);
    
    const creatorPurchases = purchases.filter(p => {
      const course = courses.find(c => c.id === p.courseId);
      return course !== undefined;
    });

    const totalEarnings = creatorPurchases.reduce((sum, purchase) => {
      return sum + calculateCreatorEarnings(purchase.amount);
    }, 0);

    const uniqueStudents = new Set(creatorPurchases.map(p => p.buyerId));

    const recentPurchases = creatorPurchases
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
      .slice(0, 10);

    return {
      totalViews,
      totalPurchases,
      totalEarnings,
      coursesCount: courses.length,
      studentsCount: uniqueStudents.size,
      recentPurchases,
    };
  };

  const downloadCourse = async (courseId: string, videoUrl: string): Promise<string> => {
    const fileUri = `${FileSystem.documentDirectory}course_${courseId}.mp4`;
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (fileInfo.exists) {
      return fileUri;
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      videoUrl,
      fileUri
    );

    const result = await downloadResumable.downloadAsync();
    if (!result) throw new Error('Download failed');

    const downloaded: DownloadedCourse = {
      courseId,
      localUri: result.uri,
      downloadedAt: Date.now(),
      fileSize: 0,
    };

    const updated = [...downloadedCourses, downloaded];
    await saveDownloadedCourses(updated);

    return result.uri;
  };

  const deleteCourseDownload = async (courseId: string) => {
    const downloaded = downloadedCourses.find(d => d.courseId === courseId);
    if (downloaded) {
      await FileSystem.deleteAsync(downloaded.localUri, { idempotent: true });
      const updated = downloadedCourses.filter(d => d.courseId !== courseId);
      await saveDownloadedCourses(updated);
    }
  };

  const isDownloaded = (courseId: string): boolean => {
    return downloadedCourses.some(d => d.courseId === courseId);
  };

  const getDownloadedUri = (courseId: string): string | null => {
    const downloaded = downloadedCourses.find(d => d.courseId === courseId);
    return downloaded?.localUri || null;
  };

  return {
    config: configQuery.data,
    courses: coursesQuery.data || [],
    isLoading: coursesQuery.isLoading,
    createCourse: createCourseMutation.mutateAsync,
    createPurchase: createPurchaseMutation.mutateAsync,
    updatePurchaseStatus: updatePurchaseStatusMutation.mutateAsync,
    createComment: createCommentMutation.mutateAsync,
    createRating: createRatingMutation.mutateAsync,
    incrementView: incrementViewMutation.mutateAsync,
    getCreatorStats,
    setCurrentUserId,
    setCurrentUserName,
    currentUserId,
    currentUserName,
    downloadCourse,
    deleteCourseDownload,
    isDownloaded,
    getDownloadedUri,
    downloadedCourses,
  };
});
