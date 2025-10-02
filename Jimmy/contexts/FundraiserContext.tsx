import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { Fundraiser, FundraiserConfig } from '@/types/fundraiser';
import { useState, useEffect } from 'react';
import * as Crypto from 'expo-crypto';

export const [FundraiserProvider, useFundraiser] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [currentUserId, setCurrentUserId] = useState<string>('anonymous');

  const configQuery = useQuery({
    queryKey: ['fundraiser-config'],
    queryFn: async (): Promise<FundraiserConfig> => {
      const docRef = doc(db, 'public', 'fundraiser_config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as FundraiserConfig;
      }
      return {
        platformFeePercent: 5,
        currency: 'CDF',
        minDonation: 500,
        maxDonation: 500000,
      };
    },
  });

  const fundraisersQuery = useQuery({
    queryKey: ['fundraisers'],
    queryFn: async (): Promise<Fundraiser[]> => {
      const q = query(
        collection(db, 'fundraisers'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const allFundraisers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Fundraiser[];
      return allFundraisers.filter(f => f.isActive);
    },
  });

  useEffect(() => {
    const q = query(
      collection(db, 'fundraisers'),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allFundraisers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Fundraiser[];
      const activeFundraisers = allFundraisers.filter(f => f.isActive);
      queryClient.setQueryData(['fundraisers'], activeFundraisers);
    });

    return () => unsubscribe();
  }, [queryClient]);

  const createFundraiserMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      goal: number;
      category: string;
      tags: string[];
      deadline?: Date;
      imageUri?: string;
    }) => {
      let coverImageUrl = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800';

      if (data.imageUri) {
        const response = await fetch(data.imageUri);
        const blob = await response.blob();
        const filename = `fundraisers/${Date.now()}.jpg`;
        const storageRef = ref(storage, filename);
        await uploadBytes(storageRef, blob);
        coverImageUrl = await getDownloadURL(storageRef);
      }

      const fundraiser: Record<string, any> = {
        title: data.title,
        description: data.description,
        coverImageUrl,
        goal: data.goal * 100,
        raised: 0,
        currency: configQuery.data?.currency || 'CDF',
        creatorId: currentUserId,
        creatorName: 'Utilisateur',
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        category: data.category,
        tags: data.tags,
      };

      if (data.deadline) {
        fundraiser.deadline = Timestamp.fromDate(data.deadline);
      }

      const docRef = await addDoc(collection(db, 'fundraisers'), fundraiser);
      return { id: docRef.id, ...fundraiser };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fundraisers'] });
    },
  });

  const createDonationMutation = useMutation({
    mutationFn: async (data: {
      fundraiserId: string;
      amount: number;
      donorName: string;
      donorPhone: string;
      message?: string;
      isPublic: boolean;
    }) => {
      const depositId = Crypto.randomUUID();
      
      const donation: Record<string, any> = {
        fundraiserId: data.fundraiserId,
        donorName: data.donorName,
        donorPhone: data.donorPhone,
        amount: data.amount * 100,
        currency: configQuery.data?.currency || 'CDF',
        depositId,
        status: 'pending' as const,
        isPublic: data.isPublic,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      if (currentUserId && currentUserId !== 'anonymous') {
        donation.donorId = currentUserId;
      }

      if (data.message && data.message.trim()) {
        donation.message = data.message;
      }

      const docRef = await addDoc(collection(db, 'donations'), donation);
      return { id: docRef.id, ...donation };
    },
  });

  const updateDonationStatusMutation = useMutation({
    mutationFn: async (data: { donationId: string; status: string }) => {
      const docRef = doc(db, 'donations', data.donationId);
      await updateDoc(docRef, {
        status: data.status,
        updatedAt: Timestamp.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['fundraisers'] });
    },
  });

  return {
    config: configQuery.data,
    fundraisers: fundraisersQuery.data || [],
    isLoading: fundraisersQuery.isLoading,
    createFundraiser: createFundraiserMutation.mutateAsync,
    createDonation: createDonationMutation.mutateAsync,
    updateDonationStatus: updateDonationStatusMutation.mutateAsync,
    setCurrentUserId,
  };
});
