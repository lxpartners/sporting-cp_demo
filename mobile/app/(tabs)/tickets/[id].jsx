import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { api, API_BASE } from '../../../lib/api';
import * as SecureStore from 'expo-secure-store';

const GREEN = '#006B38';
const GOLD  = '#FFD700';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken]     = useState('');

  useEffect(() => {
    Promise.all([
      api.ticket(id),
      SecureStore.getItemAsync('token'),
    ]).then(([t, tok]) => {
      setTicket(t);
      setToken(tok || '');
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={GREEN} size="large" /></View>;
  if (!ticket) return <View style={styles.center}><Text>Bilhete não encontrado</Text></View>;

  const date = new Date(ticket.starts_at);
  const dateStr = date.toLocaleDateString('pt', { weekday: 'short', day: 'numeric', month: 'long' });
  const timeStr = date.toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView style={styles.container}>
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹  Bilhetes</Text>
      </TouchableOpacity>

      {/* Ticket */}
      <View style={styles.ticket}>
        {/* Header */}
        <View style={styles.ticketHeader}>
          <Text style={styles.competition}>{ticket.competition}</Text>
          <Text style={styles.matchTitle}>{ticket.home_team}  ×  {ticket.away_team}</Text>
          <View style={styles.ticketMeta}>
            <Text style={styles.ticketMetaText}>📅 {dateStr}</Text>
            <Text style={styles.ticketMetaText}>⏰ {timeStr}</Text>
            <Text style={styles.ticketMetaText}>🏟 {ticket.venue}</Text>
          </View>
        </View>

        {/* Perforation */}
        <View style={styles.perforation}>
          <View style={styles.perfCircleL} />
          <View style={styles.perfLine} />
          <View style={styles.perfCircleR} />
        </View>

        {/* Seat info */}
        <View style={styles.seatRow}>
          {[
            { label: 'SETOR', value: ticket.section },
            { label: 'FILA',  value: ticket.row_label },
            { label: 'LUGAR', value: ticket.seat_number },
          ].map(f => (
            <View key={f.label} style={styles.seatField}>
              <Text style={styles.seatLabel}>{f.label}</Text>
              <Text style={styles.seatValue}>{f.value}</Text>
            </View>
          ))}
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <QRCode
            value={ticket.qr_data || ticket.id}
            size={200}
            color={GREEN}
            backgroundColor="white"
            logo={require('../../../assets/icon.png')}
            logoSize={36}
            logoBackgroundColor="white"
            logoBorderRadius={4}
          />
          <Text style={styles.ticketId}>SCP-{ticket.id.slice(0, 12).toUpperCase()}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: GREEN }]}
            onPress={() => router.push({ pathname: '/(tabs)/tickets/transfer', params: { id: ticket.id } })}
          >
            <Text style={styles.actionBtnText}>↗  Transferir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: GOLD }]}
            onPress={() => router.push({ pathname: '/(tabs)/tickets/sell', params: { id: ticket.id, price: ticket.price_paid } })}
          >
            <Text style={[styles.actionBtnText, { color: GREEN }]}>💰  Vender</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          ⚠️  QR code válido para uma entrada. Expira após utilização.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f8f9fa' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn:      { padding: 16, paddingTop: 20 },
  backText:     { fontSize: 16, color: GREEN, fontWeight: '600' },
  ticket:       { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, marginBottom: 32 },
  ticketHeader: { backgroundColor: GREEN, padding: 20 },
  competition:  { fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  matchTitle:   { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 10 },
  ticketMeta:   { gap: 4 },
  ticketMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  perforation:  { flexDirection: 'row', alignItems: 'center', marginVertical: 0 },
  perfCircleL:  { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f8f9fa', marginLeft: -10 },
  perfLine:     { flex: 1, borderTopWidth: 2, borderTopColor: '#e8e8e8', borderStyle: 'dashed' },
  perfCircleR:  { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f8f9fa', marginRight: -10 },
  seatRow:      { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16 },
  seatField:    { flex: 1, alignItems: 'center' },
  seatLabel:    { fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 },
  seatValue:    { fontSize: 24, fontWeight: '900', color: '#1c1c1e', marginTop: 4 },
  qrContainer:  { alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  ticketId:     { marginTop: 8, fontSize: 11, color: '#bbb', fontFamily: 'monospace' },
  actions:      { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
  actionBtn:    { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  disclaimer:   { fontSize: 11, color: '#aaa', textAlign: 'center', paddingHorizontal: 20, paddingBottom: 16 },
});
