import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, useColorScheme, Share, Platform } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Fundraiser, Donation } from '@/types/fundraiser';
import { Heart, Share2, Users, Clock, Target, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CATEGORIES } from '@/constants/fundraisers';
import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import Colors from '@/constants/colors';

export default function FundraiserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const fundraiserQuery = useQuery({
    queryKey: ['fundraiser', id],
    queryFn: async (): Promise<Fundraiser> => {
      const docRef = doc(db, 'fundraisers', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('Fundraiser not found');
      }
      return { id: docSnap.id, ...docSnap.data() } as Fundraiser;
    },
  });

  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'donations'),
      where('fundraiserId', '==', id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const donationsList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Donation[];
      
      const filteredDonations = donationsList.filter(
        d => d.status === 'success' && d.isPublic === true
      );
      setDonations(filteredDonations);
    });

    return () => unsubscribe();
  }, [id]);

  const handleShare = async () => {
    const url = Linking.createURL(`/fundraisers/${id}`);
    try {
      await Share.share({
        message: `Soutenez cette cagnotte: ${fundraiserQuery.data?.title}\n${url}`,
        url,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  if (fundraiserQuery.isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (!fundraiserQuery.data) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Cagnotte introuvable</Text>
      </View>
    );
  }

  const fundraiser = fundraiserQuery.data;
  const progress = (fundraiser.raised / fundraiser.goal) * 100;
  const category = CATEGORIES.find(c => c.value === fundraiser.category);
  const daysLeft = fundraiser.deadline
    ? Math.max(0, Math.ceil((fundraiser.deadline.toDate().getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Share2 size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          <Image source={{ uri: fundraiser.coverImageUrl }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)']}
            style={styles.heroGradient}
          />
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.tint + '20' }]}>
              <Text style={[styles.categoryText, { color: colors.tint }]}>{category?.label}</Text>
            </View>
            {daysLeft !== null && (
              <View style={styles.daysLeftContainer}>
                <Clock size={16} color={colors.textSecondary} />
                <Text style={[styles.daysLeftText, { color: colors.textSecondary }]}>
                  {daysLeft} jours
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{fundraiser.title}</Text>
          <Text style={[styles.creator, { color: colors.textSecondary }]}>Par {fundraiser.creatorName}</Text>

          <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressPercent, { color: colors.tint }]}>
                {progress.toFixed(0)}%
              </Text>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                de l&apos;objectif
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
              <LinearGradient
                colors={[colors.gradient1, colors.gradient2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: colors.success + '20' }]}>
                  <Sparkles size={20} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {(fundraiser.raised / 100).toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>
                  CDF collectés
                </Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: colors.tint + '20' }]}>
                  <Users size={20} color={colors.tint} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{donations.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Donateurs</Text>
              </View>

              <View style={styles.statBox}>
                <View style={[styles.statIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Target size={20} color={colors.accent} />
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {(fundraiser.goal / 100).toLocaleString()}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Objectif</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {fundraiser.description}
            </Text>
          </View>

          {donations.length > 0 && (
            <View style={styles.section}>
              <View style={styles.donationsHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Donateurs ({donations.length})
                </Text>
              </View>
              {donations.slice(0, 10).map((donation) => (
                <View key={donation.id} style={[styles.donationItem, { backgroundColor: colors.card }]}>
                  <View style={[styles.donationAvatar, { backgroundColor: colors.accent + '20' }]}>
                    <Heart size={18} color={colors.accent} />
                  </View>
                  <View style={styles.donationInfo}>
                    <Text style={[styles.donationName, { color: colors.text }]}>
                      {donation.donorName}
                    </Text>
                    {donation.message && (
                      <Text style={[styles.donationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                        {donation.message}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.donationAmount, { color: colors.tint }]}>
                    {(donation.amount / 100).toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={styles.donateButton}
          onPress={() => router.push(`/fundraisers/donate?id=${id}`)}
        >
          <LinearGradient
            colors={[colors.gradient1, colors.gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.donateButtonGradient}
          >
            <Heart size={22} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
            <Text style={styles.donateButtonText}>Faire un don</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  shareButton: {
    marginRight: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    height: 400,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  content: {
    marginTop: -40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  daysLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  daysLeftText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 34,
    fontWeight: '800' as const,
    marginBottom: 12,
    lineHeight: 40,
    letterSpacing: -1,
  },
  creator: {
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 32,
  },
  progressCard: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    gap: 10,
  },
  progressPercent: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 28,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    marginBottom: 16,
    letterSpacing: -0.8,
  },
  description: {
    fontSize: 17,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  donationsHeader: {
    marginBottom: 20,
  },
  donationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  donationAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  donationInfo: {
    flex: 1,
  },
  donationName: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  donationMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 2,
  },
  donationAmount: {
    fontSize: 18,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  donateButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  donateButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
});
