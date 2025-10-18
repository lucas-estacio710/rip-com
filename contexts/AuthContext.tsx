'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import type { AuthContextType, Perfil, Unidade } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Carrega perfil e unidade do usuário
  const loadUserData = async (userId: string) => {
    try {
      // Buscar perfil
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .single();

      if (perfilError) {
        console.error('Erro ao carregar perfil:', perfilError);
        return;
      }

      setPerfil(perfilData);

      // Buscar unidade se o perfil tiver uma
      if (perfilData?.unidade_id) {
        const { data: unidadeData, error: unidadeError } = await supabase
          .from('unidades')
          .select('*')
          .eq('id', perfilData.unidade_id)
          .single();

        if (unidadeError) {
          console.error('Erro ao carregar unidade:', unidadeError);
        } else {
          setUnidade(unidadeData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  // Monitora mudanças na autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verifica sessão atual
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await loadUserData(session.user.id);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (session?.user) {
          setUser(session.user);
          await loadUserData(session.user.id);
        } else {
          setUser(null);
          setPerfil(null);
          setUnidade(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error };

      if (data.user) {
        setUser(data.user);
        await loadUserData(data.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { error };
    }
  };

  // Função de cadastro
  const signUp = async (
    email: string,
    password: string,
    nomeCompleto: string
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome_completo: nomeCompleto,
          },
        },
      });

      if (error) return { error };

      // O perfil será criado automaticamente via trigger no banco
      return { error: null };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { error };
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setPerfil(null);
      setUnidade(null);
      router.push('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // Função para atualizar perfil
  const updatePerfil = async (data: Partial<Perfil>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('perfis')
        .update(data)
        .eq('id', user.id);

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        throw error;
      }

      // Recarrega dados
      await loadUserData(user.id);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    perfil,
    unidade,
    loading,
    signIn,
    signUp,
    signOut,
    updatePerfil,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personalizado para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
