import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GREEN = '#006B38';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: GREEN,
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee', paddingBottom: 4 },
      headerStyle: { backgroundColor: GREEN },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="tickets/index" options={{ title: 'Bilhetes', tabBarIcon: ({ color }) => <Ionicons name="ticket" size={24} color={color} /> }} />
      <Tabs.Screen name="marketplace" options={{ title: 'Marketplace', tabBarIcon: ({ color }) => <Ionicons name="storefront" size={24} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} /> }} />
      {/* Hidden screens */}
      <Tabs.Screen name="tickets/[id]" options={{ href: null }} />
      <Tabs.Screen name="tickets/transfer" options={{ href: null }} />
      <Tabs.Screen name="tickets/sell" options={{ href: null }} />
    </Tabs>
  );
}
