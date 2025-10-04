import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Book, User } from 'lucide-react-native'; // Icônes pour les onglets

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#888888',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#222222',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <Home color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-courses"
        options={{
          title: 'Mes Cours',
          tabBarIcon: ({ color }) => <Book color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <User color={color} />,
        }}
      />
    </Tabs>
  );
}