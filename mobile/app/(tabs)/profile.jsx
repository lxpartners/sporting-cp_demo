import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { api, clearToken } from '../../lib/api';

const GREEN = '#006B38';
const GOLD  = '#FFD700';

const TIER_COLORS = { bronze: '#CD7F32', silver: '#A8A9AD', gold: '#FFD700', platinum: '#E5E4E2' };
const TIER_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };

export default function ProfileScreen() {
  const [member, setMember]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me().then(setMember).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    Alert.alert('Terminar sessão', 'Tens a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await clearToken(); router.replace('/(auth)/login'); } },
    ]);
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={GREEN} size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{member?.full_name.split(' ').map(w=>w[0]).join('').slice(0,2)}</Text>
        </View>
        <Text style={styles.name}>{member?.full_name}</Text>
        <Text style={styles.email}>{member?.email}</Text>
        <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[member?.tier] || GOLD }]}>
          <Text style={styles.tierText}>⭐ {TIER_LABELS[member?.tier]}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Número de Sócio', value: member?.member_number.replace(/(\d{3})(\d{3})(\d{3})/, '$1·$2·$3') },
          { label: 'Pontos',          value: member?.points?.toLocaleString() },
          { label: 'Sócio desde',     value: new Date(member?.member_since).getFullYear() },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {[
          { icon: '🎫', label: 'Os Meus Bilhetes',        onPress: () => router.push('/(tabs)/tickets/') },
          { icon: '🏪', label: 'Marketplace',              onPress: () => router.push('/(tabs)/marketplace') },
          { icon: '📜', label: 'Histórico de Transferências', onPress: () => {} },
          { icon: '⚙️', label: 'Definições',              onPress: () => {} },
        ].map(item => (
          <TouchableOpacity key={item.label} style={styles.menuRow} onPress={item.onPress}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Terminar Sessão</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Sporting CP Demo v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f8f9fa' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { backgroundColor: GREEN, alignItems: 'center', paddingTop: 32, paddingBottom: 28, paddingHorizontal: 20 },
  avatar:      { width: 80, height: 80, borderRadius: 40, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:  { fontSize: 28, fontWeight: '900', color: GREEN },
  name:        { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email:       { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 },
  tierBadge:   { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12 },
  tierText:    { fontSize: 12, fontWeight: '800', color: GREEN },
  statsRow:    { flexDirection: 'row', margin: 16, gap: 10 },
  statCard:    { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 1 },
  statValue:   { fontSize: 16, fontWeight: '900', color: GREEN, marginBottom: 4 },
  statLabel:   { fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  menu:        { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  menuRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  menuIcon:    { fontSize: 20, marginRight: 14 },
  menuLabel:   { flex: 1, fontSize: 15, color: '#1c1c1e', fontWeight: '500' },
  menuArrow:   { fontSize: 20, color: '#ccc' },
  logoutBtn:   { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#ffebee', marginBottom: 16 },
  logoutText:  { color: '#e53935', fontWeight: '700', fontSize: 15 },
  version:     { textAlign: 'center', color: '#ccc', fontSize: 12, marginBottom: 32 },
});
