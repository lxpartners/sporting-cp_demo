import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../../lib/api';

const GREEN = '#006B38';

function TicketCard({ ticket }) {
  const date = new Date(ticket.starts_at);
  const day   = date.getDate();
  const month = date.toLocaleDateString('pt', { month: 'short' }).toUpperCase();
  const time  = date.toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push({ pathname: '/(tabs)/tickets/[id]', params: { id: ticket.id } })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateBox}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.cardInfo}>
          <Text style={styles.teams}>{ticket.home_team} vs {ticket.away_team}</Text>
          <Text style={styles.meta}>{time} · {ticket.competition}</Text>
          <Text style={styles.venue}>{ticket.venue}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
      <View style={styles.seatRow}>
        {[
          { label: 'Setor', value: ticket.section },
          { label: 'Fila',  value: ticket.row_label },
          { label: 'Lugar', value: ticket.seat_number },
          { label: 'Preço', value: `${ticket.price_paid}€` },
        ].map(f => (
          <View key={f.label} style={styles.seatField}>
            <Text style={styles.seatLabel}>{f.label}</Text>
            <Text style={styles.seatValue}>{f.value}</Text>
          </View>
        ))}
      </View>
      <View style={styles.qrHint}>
        <Text style={styles.qrHintText}>🎫  Toca para ver o QR code de entrada</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TicketsScreen() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  async function load() {
    try {
      setTickets(await api.tickets());
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  if (loading) return <View style={styles.center}><ActivityIndicator color={GREEN} size="large" /></View>;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor={GREEN} />}
    >
      <View style={{ padding: 16 }}>
        {tickets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🎫</Text>
            <Text style={styles.emptyTitle}>Sem bilhetes</Text>
            <Text style={styles.emptyText}>Não tens bilhetes ativos de momento.</Text>
          </View>
        ) : (
          tickets.map(t => <TicketCard key={t.id} ticket={t} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f8f9fa' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card:        { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#e8e8e8', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  dateBox:     { alignItems: 'center', minWidth: 36 },
  dateDay:     { fontSize: 22, fontWeight: '900', color: GREEN, lineHeight: 24 },
  dateMonth:   { fontSize: 10, color: '#888', fontWeight: '700' },
  divider:     { width: 1, height: 44, backgroundColor: '#eee', marginHorizontal: 4 },
  cardInfo:    { flex: 1 },
  teams:       { fontSize: 15, fontWeight: '700', color: '#1c1c1e' },
  meta:        { fontSize: 11, color: '#888', marginTop: 2 },
  venue:       { fontSize: 11, color: GREEN, marginTop: 2, fontWeight: '600' },
  arrow:       { fontSize: 22, color: '#ccc' },
  seatRow:     { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fafafa' },
  seatField:   { flex: 1, alignItems: 'center' },
  seatLabel:   { fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  seatValue:   { fontSize: 16, fontWeight: '800', color: '#1c1c1e', marginTop: 2 },
  qrHint:      { backgroundColor: '#f0f8f4', paddingVertical: 8, paddingHorizontal: 14 },
  qrHintText:  { fontSize: 12, color: GREEN, fontWeight: '600' },
  empty:       { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle:  { fontSize: 20, fontWeight: '700', color: '#333' },
  emptyText:   { fontSize: 14, color: '#888', textAlign: 'center' },
});
