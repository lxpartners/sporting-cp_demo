import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('token').then(t => {
      setHasToken(!!t);
      setReady(true);
    });
  }, []);

  if (!ready) return null;
  return <Redirect href={hasToken ? '/(tabs)/' : '/(auth)/login'} />;
}
