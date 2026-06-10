import * as SecureStore from 'expo-secure-store';

// ⚠️  Muda para o URL do teu backend depois do deploy
export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function getToken() {
  return await SecureStore.getItemAsync('token');
}

async function request(path, options = {}) {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login:    (email, password)   => request('/api/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (full_name, email, password) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ full_name, email, password }) }),
  me:       ()                   => request('/api/auth/me'),

  // Events
  events:   ()                   => request('/api/events'),

  // Tickets
  tickets:  ()                   => request('/api/tickets'),
  ticket:   (id)                 => request(`/api/tickets/${id}`),
  transfer: (id, body)           => request(`/api/tickets/${id}/transfer`, { method: 'POST', body: JSON.stringify(body) }),
  qrUrl:    async (id)           => {
    const token = await getToken();
    return `${API_BASE}/api/tickets/${id}/qr.png?t=${token}`;
  },

  // Marketplace
  marketplace:    ()             => request('/api/marketplace'),
  listTicket:     (ticketId, askingPrice) => request('/api/marketplace/list', { method: 'POST', body: JSON.stringify({ ticketId, askingPrice }) }),
  buyTicket:      (listingId)    => request(`/api/marketplace/${listingId}/buy`, { method: 'POST' }),
  delistTicket:   (listingId)    => request(`/api/marketplace/${listingId}`,     { method: 'DELETE' }),

  // Search members
  searchMembers:  (q)            => request(`/api/members/search?q=${encodeURIComponent(q)}`),
};

export async function saveToken(token) {
  await SecureStore.setItemAsync('token', token);
}
export async function clearToken() {
  await SecureStore.deleteItemAsync('token');
}
