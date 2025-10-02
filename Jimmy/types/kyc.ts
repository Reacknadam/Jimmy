import { Timestamp } from 'firebase/firestore';

export type KYCStatus = 'pending' | 'approved' | 'rejected';

export interface KYCRequest {
  id: string;
  userId: string;
  userEmail: string;
  fullName: string;
  idCardUrl: string;
  phoneNumber: string;
  status: KYCStatus;
  rejectionReason?: string;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
}
