import { Timestamp } from 'firebase/firestore';

export type FundraiserCategory = 'medical' | 'education' | 'solidarity' | 'project' | 'business';

export interface Fundraiser {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  goal: number;
  raised: number;
  currency: string;
  creatorId: string;
  creatorName: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deadline?: Timestamp;
  category: FundraiserCategory;
  tags: string[];
}

export type DonationStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Donation {
  id: string;
  fundraiserId: string;
  donorId?: string;
  donorName: string;
  donorPhone: string;
  amount: number;
  currency: string;
  depositId: string;
  status: DonationStatus;
  message?: string;
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FundraiserConfig {
  platformFeePercent: number;
  currency: string;
  minDonation: number;
  maxDonation: number;
}
