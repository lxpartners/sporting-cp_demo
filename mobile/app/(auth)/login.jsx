import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { api, saveToken } from '../../lib/api';

const GREEN = '#006B38';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Erro', 'Preenche email e password');
    setLoading(true);
    try {
      const { token } = await api.login(email.trim().toLowerCase(), password);
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
      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SCP</Text>
          </View>
          <Text style={styles.title}>Sporting CP</Text>
          <Text style={styles.subtitle}>Acede à tua conta de sócio</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="o.teu@email.pt"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.link}>
            <Text style={styles.linkText}>Ainda não és sócio? <Text style={{ color: GREEN, fontWeight: '700' }}>Regista-te</Text></Text>
          </TouchableOpacity>

          <View style={styles.hint}>
            <Text style={styles.hintTitle}>Contas de demo:</Text>
            <Text style={styles.hintText}>andre@demo.pt  |  joao@demo.pt</Text>
            <Text style={styles.hintText}>Password: sporting123</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: GREEN },
  inner:       { flex: 1, justifyContent: 'center', padding: 28 },
  header:      { alignItems: 'center', marginBottom: 40 },
  logoCircle:  { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText:    { fontSize: 22, fontWeight: '900', color: GREEN },
  title:       { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle:    { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  form:        { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  label:       { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 6, marginTop: 12 },
  input:       { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, padding: 14, fontSize: 15, color: '#111', backgroundColor: '#fafafa' },
  btn:         { backgroundColor: GREEN, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  link:        { alignItems: 'center', marginTop: 18 },
  linkText:    { color: '#666', fontSize: 14 },
  hint:        { backgroundColor: '#f0f8f4', borderRadius: 10, padding: 12, marginTop: 20 },
  hintTitle:   { fontSize: 11, fontWeight: '700', color: GREEN, marginBottom: 4 },
  hintText:    { fontSize: 11, color: '#555', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
