import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { api, saveToken } from '../../lib/api';

const GREEN = '#006B38';

export default function RegisterScreen() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) return Alert.alert('Erro', 'Preenche todos os campos');
    if (password.length < 6) return Alert.alert('Erro', 'Password deve ter pelo menos 6 caracteres');
    setLoading(true);
    try {
      const { token } = await api.register(name.trim(), email.trim().toLowerCase(), password);
      await saveToken(token);
      router.replace('/(tabs)/');
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SCP</Text>
          </View>
          <Text style={styles.title}>Torna-te Sócio</Text>
          <Text style={styles.subtitle}>Cria a tua conta Sporting CP</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome completo</Text>
          <TextInput style={styles.input} placeholder="O teu nome" placeholderTextColor="#aaa" value={name} onChangeText={setName} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="o.teu@email.pt" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" placeholderTextColor="#aaa" value={password} onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Criar Conta</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.link}>
            <Text style={styles.linkText}>Já tens conta? <Text style={{ color: GREEN, fontWeight: '700' }}>Entrar</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: GREEN },
  inner:      { flexGrow: 1, justifyContent: 'center', padding: 28 },
  header:     { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText:   { fontSize: 22, fontWeight: '900', color: GREEN },
  title:      { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle:   { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  form:       { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  label:      { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 6, marginTop: 12 },
  input:      { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 14, fontSize: 15, color: '#111', backgroundColor: '#fafafa' },
  btn:        { backgroundColor: GREEN, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  link:       { alignItems: 'center', marginTop: 16 },
  linkText:   { color: '#666', fontSize: 14 },
});
