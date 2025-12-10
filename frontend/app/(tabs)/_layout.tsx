import { Tabs } from 'expo-router';
import React from 'react';

import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış',
      'Hesaptan çıkmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4CAF50',
        headerShown: true,
        headerRight: () => (
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color="#4CAF50"
            style={{ marginRight: 16, cursor: 'pointer' }}
            onPress={handleLogout}
          />
        ),
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Harita',
          headerTitle: '🗺️ Harita ve Bağışlar',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-donation"
        options={{
          title: 'Bağış Ekle',
          headerTitle: '🎁 Yeni Bağış Ekle',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={28} name="plus-circle" color={color} />,
          // donor olmayanlar için tab gizleme
          href: user?.user_type === 'donor' ? '/(tabs)/add-donation' : null,
        }}
      />
    </Tabs>
  );
}
