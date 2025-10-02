import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, BarChart3, DollarSign, Eye, ShoppingCart, BookOpen, Upload, LogOut, Shield } from 'lucide-react-native';
import { useCourse } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CreatorStats } from '@/types/course';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { currentUserId, currentUserName, setCurrentUserName, getCreatorStats } = useCourse();
  const [name, setName] = useState<string>(currentUserName);
  const [isCreator] = useState<boolean>(false);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [showBuyers, setShowBuyers] = useState<boolean>(false);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const creatorStats = await getCreatorStats(currentUserId);
      setStats(creatorStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isCreator && currentUserId !== 'anonymous') {
      loadStats();
    }
  }, [isCreator, currentUserId]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    setCurrentUserName(name.trim());
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleBecomeCreator = () => {
    Alert.alert(
      t('becomeInstructor'),
      t('verificationMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: 'Continuer',
          onPress: () => {
            router.push('/kyc/submit' as any);
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/auth/login' as any);
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert(t('error'), 'Impossible de se déconnecter');
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    text: {
      color: theme.text,
    },
    card: {
      backgroundColor: theme.card,
    },
  });

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <User size={48} color={theme.primary} />
        </View>
        <Text style={[styles.headerTitle, dynamicStyles.text]}>{t('profile')}</Text>
        {user?.email && (
          <Text style={[styles.headerEmail, { color: theme.textSecondary }]}>{user.email}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.text]}>Informations Personnelles</Text>
        
        <View style={[styles.inputContainer, dynamicStyles.card]}>
          <User size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, dynamicStyles.text]}
            placeholder={t('fullName')}
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={[styles.inputContainer, dynamicStyles.card]}>
          <Mail size={20} color={theme.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, dynamicStyles.text]}
            placeholder={t('email')}
            placeholderTextColor={theme.textSecondary}
            value={user?.email || ''}
            editable={false}
          />
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Sauvegarder</Text>
        </TouchableOpacity>
      </View>

      {isCreator ? (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={24} color={theme.primary} />
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>{t('instructorDashboard')}</Text>
            </View>

            {loadingStats ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : stats ? (
              <>
                <View style={styles.statsGrid}>
                  <View style={[styles.statCard, dynamicStyles.card]}>
                    <Eye size={24} color={theme.textSecondary} />
                    <Text style={[styles.statValue, dynamicStyles.text]}>{stats.totalViews}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('views')}</Text>
                  </View>

                  <View style={[styles.statCard, dynamicStyles.card]}>
                    <ShoppingCart size={24} color={theme.textSecondary} />
                    <Text style={[styles.statValue, dynamicStyles.text]}>{stats.totalPurchases}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('totalSales')}</Text>
                  </View>

                  <View style={[styles.statCard, dynamicStyles.card]}>
                    <DollarSign size={24} color={theme.textSecondary} />
                    <Text style={[styles.statValue, dynamicStyles.text]}>{stats.totalEarnings.toFixed(0)} CDF</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('totalEarnings')}</Text>
                  </View>

                  <View style={[styles.statCard, dynamicStyles.card]}>
                    <BookOpen size={24} color={theme.textSecondary} />
                    <Text style={[styles.statValue, dynamicStyles.text]}>{stats.coursesCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('coursesCreated')}</Text>
                  </View>

                  <View style={[styles.statCard, dynamicStyles.card]}>
                    <User size={24} color={theme.textSecondary} />
                    <Text style={[styles.statValue, dynamicStyles.text]}>{stats.studentsCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('students')}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.buyersButton, { backgroundColor: theme.primary }]}
                  onPress={() => setShowBuyers(!showBuyers)}
                >
                  <User size={20} color="#fff" />
                  <Text style={styles.buyersButtonText}>
                    {showBuyers ? 'Masquer les acheteurs' : 'Voir les acheteurs'}
                  </Text>
                </TouchableOpacity>

                {showBuyers && stats.recentPurchases.length > 0 && (
                  <View style={[styles.buyersList, dynamicStyles.card]}>
                    <Text style={[styles.buyersTitle, dynamicStyles.text]}>{t('buyers')}</Text>
                    {stats.recentPurchases.map((purchase, index) => (
                      <View key={purchase.id || index} style={styles.buyerItem}>
                        <View style={styles.buyerInfo}>
                          <User size={16} color={theme.textSecondary} />
                          <Text style={[styles.buyerName, dynamicStyles.text]}>{purchase.buyerName}</Text>
                        </View>
                        <View style={styles.buyerDetails}>
                          <Text style={[styles.buyerCourse, { color: theme.textSecondary }]}>{purchase.courseName}</Text>
                          <Text style={[styles.buyerAmount, { color: theme.primary }]}>{purchase.amount.toFixed(0)} CDF</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </View>

          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push('/courses/new' as any)}
            >
              <Upload size={24} color="#fff" />
              <Text style={[styles.uploadButtonText, { color: '#fff' }]}>{t('createCourse')}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.section}>
          <View style={[styles.creatorCard, dynamicStyles.card]}>
            <Shield size={48} color={theme.primary} />
            <Text style={[styles.creatorTitle, dynamicStyles.text]}>{t('becomeInstructor')}</Text>
            <Text style={[styles.creatorDescription, { color: theme.textSecondary }]}>
              Partagez vos connaissances et gagnez de l&apos;argent en créant des formations vidéo. Gagnez 150 CDF par minute de contenu.
            </Text>
            <TouchableOpacity style={[styles.creatorButton, { backgroundColor: theme.primary }]} onPress={handleBecomeCreator}>
              <Text style={[styles.creatorButtonText, { color: '#fff' }]}>Commencer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={[styles.logoutButton, { borderColor: theme.border }]} onPress={handleLogout}>
          <LogOut size={20} color={theme.textSecondary} />
          <Text style={[styles.logoutButtonText, { color: theme.textSecondary }]}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Frais de plateforme: 20% (hébergement, transactions, maintenance)
        </Text>
        <Text style={[styles.infoText, { color: theme.textSecondary }]}>
          Tarification: 150 CDF par minute de contenu vidéo
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  headerEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  creatorCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  creatorTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  creatorDescription: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  creatorButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  creatorButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    lineHeight: 20,
  },
  buyersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  buyersButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buyersList: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  buyersTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  buyerItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buyerDetails: {
    marginLeft: 24,
  },
  buyerCourse: {
    fontSize: 14,
    marginBottom: 2,
  },
  buyerAmount: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
