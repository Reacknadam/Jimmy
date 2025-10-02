import { Timestamp } from 'firebase/firestore';

export type CourseCategory = 
  | 'technology' 
  | 'business' 
  | 'design' 
  | 'marketing' 
  | 'health' 
  | 'language' 
  | 'music' 
  | 'photography'
  | 'cooking'
  | 'other';

export type AccountType = 'personal' | 'creator';

export type PurchaseStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  durationMinutes: number;
  price: number;
  currency: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  category: CourseCategory;
  tags: string[];
  isActive: boolean;
  totalViews: number;
  totalPurchases: number;
  averageRating: number;
  totalRatings: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Creator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  accountType: AccountType;
  isVerified: boolean;
  idCardUrl?: string;
  idCardVerifiedAt?: Timestamp;
  totalEarnings: number;
  totalCourses: number;
  totalStudents: number;
  totalViews: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Purchase {
  id: string;
  courseId: string;
  courseName: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  amount: number;
  currency: string;
  paymentMethod: 'stripe' | 'pawapay';
  depositId?: string;
  stripePaymentIntentId?: string;
  status: PurchaseStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id: string;
  courseId: string;
  creatorId: string;
  senderId: string;
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface Rating {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  createdAt: Timestamp;
}

export interface PlatformConfig {
  platformFeePercent: number;
  pricePerMinute: number;
  currency: string;
  minCourseDuration: number;
  maxCourseDuration: number;
}

export interface CreatorStats {
  totalViews: number;
  totalPurchases: number;
  totalEarnings: number;
  coursesCount: number;
  studentsCount: number;
  recentPurchases: Purchase[];
}

export interface DownloadedCourse {
  courseId: string;
  localUri: string;
  downloadedAt: number;
  fileSize: number;
}
