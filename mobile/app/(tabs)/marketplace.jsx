import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../lib/api';

const GREEN = '#006B38';
const GOLD  = '#FFD700';

function ListingCard({ listing, onBuy }) {
  const date = new Date(listing.starts_at);
  const dateStr = date.toLocaleDateString('pt', { day: 'numeric', month: 'short' });
  const timeStr = date.toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' });
  const saving = (listing.original_price - listing.asking_price).toFixed(2);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <Text style={styles.competition}>{listing.competition}</Text>
          <Text style={styles.teams}>{listing.home_team} vs {listing.away_team}</Text>
          <Text style={styles.meta}>{dateStr} · {timeStr} · {listing.venue.replace('Estádio de ','')}</Text>
        </View>
        {parseFloat(saving) > 0 && (
          <View style={styles.savingBadge}>
            <Text style={styles.savingText}>- {saving}€</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <View style={styles.seatInfo}>
          {[['Setor', listing.section], ['Fila', listing.row_label], ['Lugar', listing.seat_number]].map(([l, v]) => (
            <View key={l} style={styles.seatField}>
              <Text style={styles.seatLabel}>{l}</Text>
              <Text style={styles.seatValue}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.sellerLabel}>Vendido por</Text>
            <Text style={styles.sellerName}>{listing.seller_name}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.price}>{listing.asking_price}€</Text>
            {parseFloat(saving) > 0 && (
              <Text style={styles.originalPrice}>{listing.original_price}€</Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.buyBtn} onPress={() => onBuy(listing)}>
          <Text style={styles.buyBtnText}>Comprar Bilhete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function MarketplaceScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refresh, setRefresh]   = useState(false);

  async function load() {
    try { setListings(await api.marketplace()); }
    catch {} finally { setLoading(false); setRefresh(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  function handleBuy(listing) {
    Alert.alert(
      'Confirmar Compra',
      `${listing.home_team} vs ${listing.away_team}\nSetor ${listing.section} · Fila ${listing.row_label} · Lugar ${listing.seat_number}\n\nPreço: ${listing.asking_price}€`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: `Pagar ${listing.asking_price}€`,
          onPress: async () => {
            try {
              const res = await api.buyTicket(listing.id);
              Alert.alert('✅ Comprado!', res.message, [{ text: 'Ver Bilhete', onPress: () => load() }]);
            } catch (e) {
              Alert.alert('Erro', e.message);
            }
          },
        },
      ]
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={GREEN} size="large" /></View>;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor={GREEN} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <Text style={styles.headerSub}>Bilhetes à venda por sócios</Text>
      </View>

      <View style={{ padding: 16 }}>
        {listings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40 }}>🏪</Text>
            <Text style={styles.emptyTitle}>Sem anúncios</Text>
            <Text style={styles.emptyText}>Nenhum bilhete disponível de momento.</Text>
          </View>
        ) : (
          listings.map(l => <ListingCard key={l.id} listing={l} onBuy={handleBuy} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f8f9fa' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:        { backgroundColor: GREEN, padding: 20, paddingTop: 28 },
  headerTitle:   { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  card:          { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8 },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', padding: 14, paddingBottom: 10 },
  competition:   { fontSize: 10, color: GREEN, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  teams:         { fontSize: 16, fontWeight: '800', color: '#1c1c1e' },
  meta:          { fontSize: 11, color: '#888', marginTop: 2 },
  savingBadge:   { backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  savingText:    { color: GREEN, fontWeight: '800', fontSize: 12 },
  details:       { borderTopWidth: 1, borderTopColor: '#f0f0f0', padding: 14 },
  seatInfo:      { flexDirection: 'row', marginBottom: 14 },
  seatField:     { flex: 1, alignItems: 'center' },
  seatLabel:     { fontSize: 9, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  seatValue:     { fontSize: 18, fontWeight: '900', color: '#1c1c1e', marginTop: 2 },
  priceRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  sellerLabel:   { fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  sellerName:    { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 2 },
  priceBox:      { alignItems: 'flex-end' },
  price:         { fontSize: 28, fontWeight: '900', color: GREEN },
  originalPrice: { fontSize: 12, color: '#aaa', textDecorationLine: 'line-through' },
  buyBtn:        { backgroundColor: GREEN, borderRadius: 12, padding: 14, alignItems: 'center' },
  buyBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  empty:         { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle:    { fontSize: 20, fontWeight: '700', color: '#333' },
  emptyText:     { fontSize: 14, color: '#888', textAlign: 'center' },
});
