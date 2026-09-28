import { router, type Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';

import { getSupabase, isSupabaseConfigured } from '@/src/persistence/supabase-client';

type SessionValue = {
  configured: boolean;
  ready: boolean;
  session: Session | null;
};

const SessionContext = createContext<SessionValue>({
  configured: false,
  ready: false,
  session: null,
});

function routeForAuthType(type: string | null): Href | null {
  if (type === 'recovery') {
    return '/restablecer' as Href;
  }
  if (type === 'signup' || type === 'email' || type === 'email_change') {
    return '/correo-confirmado' as Href;
  }
  return null;
}

export async function consumeAuthUrl(url: string): Promise<Href | null> {
  if (!url.includes('ahorruta://')) {
    return null;
  }
  const parsed = new URL(url);
  const code = parsed.searchParams.get('code');
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const type = hash.get('type') ?? parsed.searchParams.get('type');
  const supabase = getSupabase();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      throw error;
    }
  } else if (hash.get('access_token') && hash.get('refresh_token')) {
    const { error } = await supabase.auth.setSession({
      access_token: hash.get('access_token') ?? '',
      refresh_token: hash.get('refresh_token') ?? '',
    });
    if (error) {
      throw error;
    }
  } else {
    return null;
  }

  return routeForAuthType(type);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [ready, setReady] = useState(!configured);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const supabase = getSupabase();
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }
      setSession(data.session);
      setReady(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    const openUrl = (url: string | null) => {
      if (!url) {
        return;
      }
      consumeAuthUrl(url)
        .then((href) => {
          if (href) {
            router.push(href);
          }
        })
        .catch(() => {
          router.push('/entrar' as Href);
        });
    };

    Linking.getInitialURL().then(openUrl);
    const linking = Linking.addEventListener('url', (event) => openUrl(event.url));

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
      linking.remove();
    };
  }, [configured]);

  const value = useMemo(() => ({ configured, ready, session }), [configured, ready, session]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  return useContext(SessionContext);
}
