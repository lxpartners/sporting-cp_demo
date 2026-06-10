import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { api } from '../../../lib/api';

const GREEN = '#006B38';

export default function TransferScreen() {
  const { id } = useLocalSearchParams();
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);

  async function search(text) {
    setQuery(text);
    setSelected(null);
    if (text.length < 2) return setResults([]);
    setLoading(true);
    try {
      setResults(await api.searchMembers(text));
    } catch {} finally { setLoading(false); }
  }

  async function doTransfer() {
    if (!selected) return Alert.alert('Erro', 'Seleciona um destinatário');
    setSending(true);
    try {
      const res = await api.transfer(id, { targetMemberNumber: selected.member_number });
      Alert.alert('✅ Transferido!', res.message, [{ text: 'OK', onPress: () => router.replace('/(tabs)/tickets/') }]);
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹  Voltar</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>Transferir Bilhete</Text>
          <Text style={styles.subtitle}>Pesquisa por nome, email ou número de sócio</Text>

          <TextInput
            style={styles.input}
            placeholder="Nome, email ou nº de sócio..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={search}
            autoFocus
          />

          {loading && <ActivityIndicator color={GREEN} style={{ marginTop: 12 }} />}

          {results.map(m => (
            <TouchableOpacity
              key={m.id}
              style={[styles.resultRow, selected?.id === m.id && styles.resultSelected]}
              onPress={() => setSelected(m)}
            >
              <View style={[styles.avatar, { backgroundColor: avatarColor(m.full_name) }]}>
                <Text style={styles.avatarText}>{m.full_name.split(' ').map(w => w[0]).join('').slice(0,2)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{m.full_name}</Text>
                <Text style={styles.resultNum}>Sócio nº {m.member_number}</Text>
              </View>
              {selected?.id === m.id && <Text style={{ color: GREEN, fontWeight: '700' }}>✓</Text>}
            </TouchableOpacity>
          ))}

          {selected && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmTitle}>Transferir para:</Text>
              <Text style={styles.confirmName}>{selected.full_name}</Text>
              <Text style={styles.confirmNum}>Sócio nº {selected.member_number}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.btn, !selected && styles.btnDisabled]}
            onPress={doTransfer}
            disabled={!selected || sending}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmar Transferência</Text>}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>🔒 O bilhete ficará registado no nome do destinatário. O QR original é invalidado imediatamente.</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const COLORS = ['#4CAF50','#2196F3','#FF9800','#9C27B0','#F44336','#00BCD4'];
function avatarColor(name) { return COLORS[name.charCodeAt(0) % COLORS.length]; }

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f8f9fa' },
  backBtn:         { padding: 16, paddingTop: 20 },
  backText:        { fontSize: 16, color: GREEN, fontWeight: '600' },
  content:         { padding: 16 },
  title:           { fontSize: 24, fontWeight: '800', color: '#1c1c1e', marginBottom: 4 },
  subtitle:        { fontSize: 14, color: '#888', marginBottom: 20 },
  input:           { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, padding: 14, fontSize: 15, backgroundColor: '#fff', color: '#111' },
  resultRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 14, borderRadius: 12, marginTop: 8, borderWidth: 1.5, borderColor: '#eee' },
  resultSelected:  { borderColor: GREEN, backgroundColor: '#f0f8f4' },
  avatar:          { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText:      { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultName:      { fontSize: 15, fontWeight: '700', color: '#1c1c1e' },
  resultNum:       { fontSize: 12, color: '#888', marginTop: 2 },
  confirmBox:      { backgroundColor: '#f0f8f4', borderRadius: 12, padding: 16, marginTop: 20, borderWidth: 1.5, borderColor: GREEN },
  confirmTitle:    { fontSize: 11, color: GREEN, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  confirmName:     { fontSize: 18, fontWeight: '800', color: '#1c1c1e' },
  confirmNum:      { fontSize: 13, color: '#888' },
  btn:             { backgroundColor: GREEN, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  btnDisabled:     { backgroundColor: '#ccc' },
  btnText:         { color: '#fff', fontWeight: '700', fontSize: 16 },
  infoBox:         { backgroundColor: '#f8f8f8', borderRadius: 10, padding: 12, marginTop: 16 },
  infoText:        { fontSize: 12, color: '#888', lineHeight: 18 },
});
