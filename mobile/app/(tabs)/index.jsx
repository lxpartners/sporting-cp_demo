import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { api } from '../../lib/api';

const GREEN = '#006B38';
const GOLD  = '#FFD700';

function MemberCard({ member }) {
  const tierColors = { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2' };
  return (
    <View style={styles.memberCard}>
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.cardLabel}>SÓCIO Nº</Text>
          <Text style={styles.cardNumber}>{member.member_number.replace(/(\d{3})(\d{3})(\d{3})/, '$1 · $2 · $3')}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: tierColors[member.tier] || GOLD }]}>
          <Text style={styles.badgeText}>{member.tier.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cardName}>{member.full_name}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardSince}>Sócio desde {new Date(member.member_since).getFullYear()}</Text>
        <View>
          <Text style={[styles.cardPoints, { color: GOLD }]}>{member.points.toLocaleString()}</Text>
          <Text style={styles.cardPointsLabel}>pontos</Text>
        </View>
      </View>
    </View>
  );
}

function GameCard({ event }) {
  const date = new Date(event.starts_at);
  const day   = date.getDate();
  const month = date.toLocaleDateString('pt', { month: 'short' }).toUpperCase();
  const time  = date.toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={[styles.gameCard, event.has_ticket && styles.gameCardActive]}
      onPress={() => event.has_ticket && router.push('/(tabs)/tickets/')}
    >
      <View style={styles.dateBox}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateMonth}>{month}</Text>
      </View>
      <View style={styles.dateDivider} />
      <View style={styles.gameInfo}>
        <Text style={styles.gameTeams}>{event.home_team} vs {event.away_team}</Text>
        <Text style={styles.gameMeta}>{time} · {event.venue.replace('Estádio de ', '')}</Text>
        <Text style={styles.gameComp}>{event.competition}</Text>
      </View>
      {event.has_ticket > 0 && (
        <View style={styles.ticketBadge}>
          <Text style={styles.ticketBadgeText}>Tenho bilhete</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const [member, setMember]   = useState(null);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  async function load(isRefresh = false) {
    try {
      const [m, e] = await Promise.all([api.me(), api.events()]);
      setMember(m);
      setEvents(e);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={GREEN} size="large" /></View>;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(true); }} tintColor={GREEN} />}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Bem-vindo,</Text>
          <Text style={styles.topName}>{member?.full_name.split(' ')[0]} 👋</Text>
        </View>
      </View>

      {member && <MemberCard member={member} />}

      {/* Quick actions */}
      <View style={styles.section}>
        <View style={styles.quickActions}>
          {[
            { icon: '🎫', label: 'Bilhetes',     onPress: () => router.push('/(tabs)/tickets/') },
            { icon: '🏪', label: 'Marketplace',  onPress: () => router.push('/(tabs)/marketplace') },
            { icon: '🛒', label: 'Comprar',      onPress: () => {} },
            { icon: '💳', label: 'Cartão',       onPress: () => router.push('/(tabs)/profile') },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={a.onPress}>
              <View style={styles.actionIcon}><Text style={{ fontSize: 24 }}>{a.icon}</Text></View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Upcoming games */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos Jogos</Text>
        {events.map(e => <GameCard key={e.id} event={e} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f8f9fa' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar:           { backgroundColor: GREEN, paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  greeting:         { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  topName:          { fontSize: 24, fontWeight: '800', color: '#fff' },
  // Member card
  memberCard:       { backgroundColor: GREEN, marginHorizontal: 16, marginTop: -12, borderRadius: 16, padding: 20, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  cardRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLabel:        { fontSize: 10, color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  cardNumber:       { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', marginTop: 2 },
  badge:            { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText:        { fontSize: 10, fontWeight: '800', color: GREEN },
  cardName:         { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 12 },
  cardSince:        { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  cardPoints:       { fontSize: 24, fontWeight: '900', textAlign: 'right' },
  cardPointsLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  // Section
  section:          { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle:     { fontSize: 17, fontWeight: '800', color: '#1c1c1e', marginBottom: 12 },
  // Quick actions
  quickActions:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  actionBtn:        { alignItems: 'center', flex: 1 },
  actionIcon:       { width: 56, height: 56, backgroundColor: '#e8f5ec', borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel:      { fontSize: 11, color: '#555', fontWeight: '600', textAlign: 'center' },
  // Game card
  gameCard:         { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#e8e8e8' },
  gameCardActive:   { borderColor: GREEN, backgroundColor: '#f0f8f4' },
  dateBox:          { alignItems: 'center', minWidth: 36 },
  dateDay:          { fontSize: 22, fontWeight: '900', color: GREEN, lineHeight: 24 },
  dateMonth:        { fontSize: 10, color: '#888', fontWeight: '700' },
  dateDivider:      { width: 1, height: 40, backgroundColor: '#e0e0e0', marginHorizontal: 4 },
  gameInfo:         { flex: 1 },
  gameTeams:        { fontSize: 14, fontWeight: '700', color: '#1c1c1e' },
  gameMeta:         { fontSize: 11, color: '#888', marginTop: 2 },
  gameComp:         { fontSize: 10, color: GREEN, marginTop: 2, fontWeight: '600' },
  ticketBadge:      { backgroundColor: GREEN, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ticketBadgeText:  { color: '#fff', fontSize: 10, fontWeight: '700' },
});
