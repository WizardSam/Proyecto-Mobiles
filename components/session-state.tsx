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

const codeExchanges = new Map<string, Promise<void>>();

function isAuthReturn(url: string, parsed: URL): boolean {
  if (url.includes('ahorruta://')) {
    return true;
  }
  return parsed.pathname === '/restablecer' || parsed.pathname === '/correo-confirmado';
}

export async function consumeAuthUrl(url: string): Promise<Href | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!isAuthReturn(url, parsed)) {
    return null;
  }
  const code = parsed.searchParams.get('code');
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const type = hash.get('type') ?? parsed.searchParams.get('type');
  const supabase = getSupabase();

  if (code) {
    let pending = codeExchanges.get(code);
    if (!pending) {
      pending = supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          codeExchanges.delete(code);
          throw error;
        }
      });
      codeExchanges.set(code, pending);
    }
    await pending;
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
          const target = url.includes('restablecer') ? '/restablecer' : '/correo-confirmado';
          router.replace(`${target}?error=caducado` as Href);
        });
    };

    const initialUrl =
      typeof window !== 'undefined' && window.location?.href
        ? Promise.resolve(window.location.href)
        : Linking.getInitialURL();
    initialUrl.then(openUrl);
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
