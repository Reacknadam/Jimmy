import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, Stack } from 'expo-router';
import { COLORS, SIZES, FONTS } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type Role = 'utilisateur' | 'formateur';

export default function SignupScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('utilisateur');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const { error } = await signUp(fullName, email, password, role);
      if (error) throw error;
      Alert.alert(
        'Inscription réussie !',
        'Veuillez vérifier votre boîte de réception pour confirmer votre adresse e-mail.'
      );
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert("Erreur d'inscription", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Rejoignez notre communauté</Text>

        <TextInput
          style={styles.input}
          placeholder="Nom complet"
          placeholderTextColor={COLORS.textSecondary}
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Adresse e-mail"
          placeholderTextColor={COLORS.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={COLORS.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.roleLabel}>Je suis un :</Text>
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'utilisateur' && styles.roleButtonActive]}
            onPress={() => setRole('utilisateur')}
          >
            <Text style={[styles.roleText, role === 'utilisateur' && styles.roleTextActive]}>Utilisateur</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'formateur' && styles.roleButtonActive]}
            onPress={() => setRole('formateur')}
          >
            <Text style={[styles.roleText, role === 'formateur' && styles.roleTextActive]}>Formateur</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.background} /> : <Text style={styles.buttonText}>S&apos;inscrire</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/auth/login')}>
          <Text style={styles.link}>Déjà un compte ? Connectez-vous</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
  },
  content: {
    padding: SIZES.padding,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  subtitle: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.padding * 2,
  },
  input: {
    ...FONTS.body3,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  roleLabel: {
    ...FONTS.h4,
    color: COLORS.textSecondary,
    marginBottom: SIZES.base,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.padding,
  },
  roleButton: {
    flex: 1,
    padding: SIZES.padding / 2,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginHorizontal: SIZES.base / 2,
  },
  roleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  roleText: {
    ...FONTS.body3,
    color: COLORS.text,
  },
  roleTextActive: {
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  buttonText: {
    ...FONTS.h3,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  link: {
    ...FONTS.body4,
    color: COLORS.primary,
    textAlign: 'center',
  },
});