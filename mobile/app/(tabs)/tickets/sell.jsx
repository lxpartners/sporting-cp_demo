import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../lib/api';

const GREEN = '#006B38';
const GOLD  = '#FFD700';

export default function SellScreen() {
  const { id, price } = useLocalSearchParams();
  const maxPrice = parseFloat(price) || 0;
  const [askingPrice, setAskingPrice] = useState(String(maxPrice));
  const [loading, setLoading]         = useState(false);

  const commission = (parseFloat(askingPrice) * 0.05).toFixed(2);
  const receives   = (parseFloat(askingPrice) * 0.95).toFixed(2);
  const tooHigh    = parseFloat(askingPrice) > maxPrice;

  async function doList() {
    if (tooHigh) return Alert.alert('Erro', `Preço máximo: ${maxPrice}€`);
    setLoading(true);
    try {
      await api.listTicket(id, parseFloat(askingPrice));
      Alert.alert('✅ Publicado!', 'O teu bilhete está no marketplace.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/marketplace') },
      ]);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹  Voltar</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Vender Bilhete</Text>
        <Text style={styles.subtitle}>Marketplace oficial — só sócios podem comprar</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>O preço não pode exceder o valor original pago. O clube retém 5% de comissão.</Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Define o preço de venda</Text>
          <View style={styles.priceRow}>
            <Text style={styles.currency}>€</Text>
            <TextInput
              style={[styles.priceInput, tooHigh && { color: 'red' }]}
              value={askingPrice}
              onChangeText={setAskingPrice}
              keyboardType="decimal-pad"
            />
          </View>
          {tooHigh && <Text style={styles.errorText}>Máximo permitido: {maxPrice}€</Text>}
        </View>

        <View style={styles.breakdown}>
          {[
            { label: 'Preço original', value: `${maxPrice}€` },
            { label: 'Preço de venda', value: `${askingPrice}€` },
            { label: 'Comissão (5%)', value: `- ${commission}€` },
            { label: 'Recebes', value: `${receives}€`, highlight: true },
          ].map(row => (
            <View key={row.label} style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, row.highlight && { fontWeight: '700', color: '#1c1c1e' }]}>{row.label}</Text>
              <Text style={[styles.breakdownValue, row.highlight && { fontSize: 20, fontWeight: '900', color: GREEN }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.btn, tooHigh && styles.btnDisabled]}
          onPress={doList}
          disabled={loading || tooHigh}
        >
          {loading
            ? <ActivityIndicator color={GREEN} />
            : <Text style={styles.btnText}>📢  Publicar no Marketplace</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f8f9fa' },
  backBtn:        { padding: 16, paddingTop: 20 },
  backText:       { fontSize: 16, color: GREEN, fontWeight: '600' },
  content:        { padding: 16 },
  title:          { fontSize: 24, fontWeight: '800', color: '#1c1c1e', marginBottom: 4 },
  subtitle:       { fontSize: 14, color: '#888', marginBottom: 20 },
  infoBox:        { flexDirection: 'row', backgroundColor: '#fffde7', borderWidth: 1.5, borderColor: GOLD, borderRadius: 12, padding: 14, gap: 10, marginBottom: 24 },
  infoIcon:       { fontSize: 18 },
  infoText:       { flex: 1, fontSize: 13, color: '#666', lineHeight: 20 },
  priceSection:   { marginBottom: 24 },
  priceLabel:     { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  priceRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 2, borderBottomColor: GREEN, paddingBottom: 8 },
  currency:       { fontSize: 28, fontWeight: '800', color: '#333' },
  priceInput:     { flex: 1, fontSize: 42, fontWeight: '900', color: GREEN },
  errorText:      { color: 'red', fontSize: 12, marginTop: 4 },
  breakdown:      { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, gap: 2 },
  breakdownRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  breakdownLabel: { fontSize: 14, color: '#666' },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: '#1c1c1e' },
  btn:            { backgroundColor: GOLD, borderRadius: 14, padding: 16, alignItems: 'center' },
  btnDisabled:    { backgroundColor: '#ccc' },
  btnText:        { color: GREEN, fontWeight: '800', fontSize: 16 },
});
