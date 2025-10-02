import createContextHook from '@nkzw/create-context-hook';
import { supabase } from '@/config/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useEffect, useState, useCallback, useMemo } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const AUTH_STATE_KEY = '@yass_auth_state';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] State changed:', _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      if (session) {
        await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
          isAuthenticated: true,
          userId: session.user.id,
          email: session.user.email,
        }));
      } else {
        await AsyncStorage.removeItem(AUTH_STATE_KEY);
      }
    });

    const handleDeepLink = Linking.addEventListener('url', ({ url }) => {
      console.log('[Auth] Deep link received:', url);
      if (url.includes('yass://auth')) {
        const params = new URL(url).searchParams;
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      handleDeepLink.remove();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('[Auth] Initializing...');
      
      const cachedState = await AsyncStorage.getItem(AUTH_STATE_KEY);
      console.log('[Auth] Cached state:', cachedState);

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('[Auth] Error getting session:', error);
        await AsyncStorage.removeItem(AUTH_STATE_KEY);
      }

      console.log('[Auth] Session loaded:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      
      if (session) {
        await AsyncStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
          isAuthenticated: true,
          userId: session.user.id,
          email: session.user.email,
        }));
      }
    } catch (error) {
      console.error('[Auth] Initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    console.log('[Auth] Signing up:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] Signing in:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    console.log('[Auth] Signing in with Google');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://yass-redirect.netlify.app/--auth',
      },
    });
    if (error) throw error;
    if (data.url) {
      await WebBrowser.openAuthSessionAsync(data.url, 'yass://auth');
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    await AsyncStorage.removeItem(AUTH_STATE_KEY);
  }, []);

  return useMemo(() => ({
    session,
    user,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  }), [session, user, loading, isAuthenticated, signUp, signIn, signInWithGoogle, signOut]);
});
