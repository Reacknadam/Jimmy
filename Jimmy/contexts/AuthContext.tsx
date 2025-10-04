import React, { useState, useEffect, createContext, useContext } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/user';

/*
-- =====================================================================================
-- IMPORTANT: INSTRUCTIONS POUR LA CONFIGURATION DE LA BASE DE DONNÉES SUPABASE
-- =====================================================================================
--
-- Pour que l'authentification et la gestion des rôles fonctionnent correctement,
-- vous devez exécuter les requêtes SQL suivantes dans l'éditeur SQL de votre projet Supabase.
--
-- Ce script crée une table `profiles` synchronisée avec les utilisateurs `auth.users`.
--
-- 1. Créez la table `profiles` :
--    Cette table stockera les informations publiques des utilisateurs, y compris leur rôle.
--
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fullName TEXT,
  email TEXT,
  avatarUrl TEXT,
  role TEXT NOT NULL DEFAULT 'utilisateur'
);
--
-- 2. Définissez les politiques de sécurité (Row Level Security) :
--    Cela garantit que les utilisateurs ne peuvent accéder et modifier que leurs propres données.
--
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT USING ( true );

CREATE POLICY "Users can insert their own profile."
ON public.profiles FOR INSERT WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE USING ( auth.uid() = id );
--
-- 3. Créez la fonction trigger :
--    Cette fonction sera appelée automatiquement pour créer un profil lorsqu'un nouvel utilisateur s'inscrit.
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, fullName, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- 4. Créez le trigger :
--    Ce trigger lie la fonction `handle_new_user` à la table `auth.users`.
--
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
--
-- =====================================================================================
*/

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email, password) => Promise<any>;
  signUp: (fullName, email, password, role) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(profile);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setUser(profile);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = async (fullName, email, password, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const signOut = () => supabase.auth.signOut();

  const value = {
    session,
    user,
    isAuthenticated: !!session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</Auth.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};