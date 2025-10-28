'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
      console.log('📥 Carregando dados do usuário:', userId);

      // Buscar perfil
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (perfilError) {
        console.error('❌ Erro ao carregar perfil:', perfilError);
        setPerfil(null);
        return;
      }

      if (!perfilData) {
        console.warn('⚠️ Perfil não encontrado');
        setPerfil(null);
        return;
      }

      setPerfil(perfilData);
      console.log('✅ Perfil carregado');

      // Buscar unidade se o perfil tiver uma
      if (perfilData?.unidade_id) {
        const { data: unidadeData, error: unidadeError } = await supabase
          .from('unidades')
          .select('*')
          .eq('id', perfilData.unidade_id)
          .maybeSingle();

        if (unidadeError) {
          console.error('❌ Erro ao carregar unidade:', unidadeError);
        } else if (unidadeData) {
          setUnidade(unidadeData);
          console.log('✅ Unidade carregada:', unidadeData.nome);
        }
      }
    } catch (error) {
      console.error('💥 Erro ao carregar dados do usuário:', error);
      setPerfil(null);
      setUnidade(null);
    }
  };

  // Monitora mudanças na autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        // ✅ USA getUser() ao invés de getSession()
        // getUser() revalida o token no servidor SEMPRE
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Erro ao verificar usuário:', error);
          setUser(null);
          setPerfil(null);
          setUnidade(null);
        } else if (user) {
          setUser(user);
          await loadUserData(user.id);
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

        // SEMPRE seta loading false ANTES de fazer qualquer coisa
        // Isso previne que a UI fique travada se algo der errado
        setLoading(false);

        if (session?.user) {
          setUser(session.user);

          // Só recarrega dados se for login inicial ou se mudou de usuário
          // Eventos de TOKEN_REFRESHED não precisam recarregar perfil/unidade
          if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
            console.log('📥 Evento SIGNED_IN/USER_UPDATED - carregando perfil');
            await loadUserData(session.user.id);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token renovado automaticamente - dados não precisam ser recarregados');
          }
        } else {
          setUser(null);
          setPerfil(null);
          setUnidade(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Tentando login com:', email);
      console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📊 Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro no login:', error);
        return { error };
      }

      if (data.user) {
        console.log('✅ Usuário autenticado:', data.user.email);
        // Não chama loadUserData aqui - o listener onAuthStateChange vai fazer isso
        // para evitar chamada duplicada
      }

      return { error: null };
    } catch (error) {
      console.error('💥 Erro crítico no login:', error);
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
