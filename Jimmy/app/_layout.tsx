import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ title: 'Connexion' }} />
        <Stack.Screen name="auth/signup" options={{ title: 'Inscription' }} />
        <Stack.Screen name="courses/new" options={{ title: 'Nouveau cours', presentation: 'modal' }} />
        <Stack.Screen name="courses/watch" options={{ presentation: 'fullScreenModal', headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}