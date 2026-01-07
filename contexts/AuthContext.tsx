'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Perfil, Unidade, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carregar perfil usando RPC (bypassa RLS de forma segura)
  const loadProfile = async (supabase: ReturnType<typeof createClient>) => {
    try {
      // Usar função RPC que criamos - mais rápida que select com RLS
      const { data, error } = await supabase.rpc('get_my_profile').maybeSingle();

      if (error) {
        console.error('Erro ao carregar perfil via RPC:', error);
        return null;
      }

      return data as Perfil | null;
    } catch (err) {
      console.error('Exceção ao carregar perfil:', err);
      return null;
    }
  };

  // Carregar unidade
  const loadUnidade = async (supabase: ReturnType<typeof createClient>, unidadeId: string) => {
    try {
      const { data, error } = await supabase
        .from('unidades')
        .select('*')
        .eq('id', unidadeId)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar unidade:', error);
        return null;
      }

      return data as Unidade | null;
    } catch (err) {
      console.error('Exceção ao carregar unidade:', err);
      return null;
    }
  };

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const initAuth = async () => {
      try {
        // Usar getSession() para rapidez (dados já estão no localStorage)
        const { data: { session } } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          setUser(session.user);

          // Carregar perfil
          const profileData = await loadProfile(supabase);

          if (!mounted) return;

          if (profileData) {
            setPerfil(profileData);

            // Carregar unidade se existir
            if (profileData.unidade_id) {
              const unidadeData = await loadUnidade(supabase, profileData.unidade_id);
              if (mounted && unidadeData) {
                setUnidade(unidadeData);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setPerfil(null);
          setUnidade(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setLoading(false);

          // Carregar perfil em background
          const profileData = await loadProfile(supabase);
          if (mounted && profileData) {
            setPerfil(profileData);

            if (profileData.unidade_id) {
              const unidadeData = await loadUnidade(supabase, profileData.unidade_id);
              if (mounted && unidadeData) {
                setUnidade(unidadeData);
              }
            }
          }
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
          return;
        }

        // Outros eventos - manter estado atual
        if (session?.user) {
          setUser(session.user);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Função de login
  const signIn = async (email: string, password: string) => {
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Carregar perfil após login
      if (data.user) {
        const profileData = await loadProfile(supabase);
        if (profileData) {
          setPerfil(profileData);

          if (profileData.unidade_id) {
            const unidadeData = await loadUnidade(supabase, profileData.unidade_id);
            if (unidadeData) {
              setUnidade(unidadeData);
            }
          }
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Erro no login:', error);
      return { error };
    }
  };

  // Função de cadastro
  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome_completo: nomeCompleto },
        },
      });

      return { error };
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { error };
    }
  };

  // Função de logout
  const signOut = async () => {
    const supabase = createClient();

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

  // Atualizar perfil
  const updatePerfil = async (data: Partial<Perfil>) => {
    if (!user) return;

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('perfis')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      // Recarregar perfil
      const profileData = await loadProfile(supabase);
      if (profileData) {
        setPerfil(profileData);
      }
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
