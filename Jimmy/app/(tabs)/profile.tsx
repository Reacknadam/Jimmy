import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  const handleCreateCourse = () => {
    router.push('/courses/new');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Mon Profil</Text>
      </View>
      <View style={styles.profileInfo}>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Nom complet</Text>
          <Text style={styles.infoValue}>{user.fullName}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Adresse e-mail</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Rôle</Text>
          <Text style={styles.infoValue}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {user.role === 'formateur' && (
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleCreateCourse}>
            <Text style={styles.buttonPrimaryText}>Créer un nouveau cours</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.buttonSecondary} onPress={handleSignOut}>
          <Text style={styles.buttonSecondaryText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    padding: SIZES.padding,
  },
  header: {
    ...FONTS.h1,
    color: COLORS.text,
  },
  profileInfo: {
    marginHorizontal: SIZES.padding,
  },
  infoBox: {
    backgroundColor: COLORS.surface,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.base,
  },
  infoLabel: {
    ...FONTS.body4,
    color: COLORS.textSecondary,
  },
  infoValue: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  actionsContainer: {
    marginTop: 'auto',
    padding: SIZES.padding,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.base,
  },
  buttonPrimaryText: {
    ...FONTS.h3,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    ...FONTS.h3,
    color: COLORS.error,
  },
});