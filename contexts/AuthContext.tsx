'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface User {
  id: string;
  email: string;
}

interface Perfil {
  id: string;
  nome_completo: string;
  email: string;
  unidade_id: string | null;
  cargo: string | null;
  ativo?: boolean;
}

interface Unidade {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
}

interface AuthContextType {
  user: User | null;
  perfil: Perfil | null;
  unidade: Unidade | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp?: (email: string, password: string, nome: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updatePerfil?: (data: Partial<Perfil>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carregar dados do usuário
  const loadUserData = async (userId: string) => {
    const supabase = createClient();

    try {
      // Buscar perfil
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (perfilData) {
        setPerfil(perfilData as Perfil);

        // Buscar unidade
        if (perfilData.unidade_id) {
          const { data: unidadeData } = await supabase
            .from('unidades')
            .select('*')
            .eq('id', perfilData.unidade_id)
            .maybeSingle();

          if (unidadeData) {
            setUnidade(unidadeData as Unidade);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  // Inicializar auth
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        await loadUserData(session.user.id);
      }

      setLoading(false);
    };

    init();
  }, []);

  // Login
  const signIn = async (email: string, password: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { error };
      }

      if (data?.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
        await loadUserData(data.user.id);
      }

      return { error: null };
    } catch (err) {
      return { error: err };
    }
  };

  // Logout
  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setPerfil(null);
    setUnidade(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, perfil, unidade, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
