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
  const [isLoadingData, setIsLoadingData] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Carrega perfil e unidade do usuário com timeout
  const loadUserData = async (userId: string): Promise<boolean> => {
    // Previne múltiplas chamadas simultâneas
    if (isLoadingData) {
      console.log('⏸️ Já carregando dados, aguardando...');
      return false;
    }

    setIsLoadingData(true);

    // Helper para adicionar timeout a uma promise
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), ms)
        ),
      ]);
    };

    try {
      console.log('📥 Carregando dados do usuário:', userId);

      // Buscar perfil com timeout de 30s (Supabase pode estar acordando)
      const { data: perfilData, error: perfilError } = await withTimeout(
        supabase
          .from('perfis')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        30000
      );

      if (perfilError) {
        console.error('❌ Erro ao carregar perfil:', perfilError);
        if (perfilError.code === 'PGRST116') {
          setPerfil(null);
        }
        return false;
      }

      if (!perfilData) {
        console.warn('⚠️ Perfil não encontrado');
        setPerfil(null);
        return false;
      }

      setPerfil(perfilData);
      console.log('✅ Perfil carregado');

      // Buscar unidade se o perfil tiver uma (com timeout de 10s)
      if (perfilData?.unidade_id) {
        try {
          const { data: unidadeData, error: unidadeError } = await withTimeout(
            supabase
              .from('unidades')
              .select('*')
              .eq('id', perfilData.unidade_id)
              .maybeSingle(),
            10000
          );

          if (unidadeError) {
            console.error('❌ Erro ao carregar unidade:', unidadeError);
          } else if (unidadeData) {
            setUnidade(unidadeData);
            console.log('✅ Unidade carregada:', unidadeData.nome);
          }
        } catch (unidadeError) {
          console.error('❌ Timeout ao carregar unidade:', unidadeError);
          // Continua mesmo sem unidade
        }
      }

      return true; // Sucesso
    } catch (error: any) {
      if (error?.message === 'TIMEOUT') {
        console.error('⏱️ TIMEOUT ao carregar perfil - sessão será encerrada');
      } else {
        console.error('💥 Erro ao carregar dados do usuário:', error);
      }
      return false;
    } finally {
      setIsLoadingData(false);
    }
  };

  // Monitora mudanças na autenticação
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticação...');

        // Primeiro tenta getSession (mais rápido, usa cache local)
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('✅ Sessão local encontrada:', session.user.email);
          setUser(session.user);

          // Tenta carregar dados do usuário com timeout
          const success = await loadUserData(session.user.id);

          if (!success) {
            // Se não conseguiu carregar perfil, faz logout forçado
            console.warn('⚠️ Não foi possível carregar perfil - fazendo logout');
            await supabase.auth.signOut();
            setUser(null);
            setPerfil(null);
            setUnidade(null);
            router.push('/login?error=session_expired');
          }
        } else {
          console.log('ℹ️ Nenhuma sessão local encontrada');
          setUser(null);
          setPerfil(null);
          setUnidade(null);
        }
      } catch (error) {
        console.error('💥 Erro ao inicializar autenticação:', error);
        setUser(null);
        setPerfil(null);
        setUnidade(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth event:', event, 'User:', session?.user?.email || 'none');

        // SEMPRE seta loading false ANTES de fazer qualquer coisa
        setLoading(false);

        if (event === 'SIGNED_OUT') {
          console.log('👋 Logout detectado - limpando estado');
          setUser(null);
          setPerfil(null);
          setUnidade(null);
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token renovado com sucesso');
          // Não precisa recarregar dados, apenas atualiza o user
          if (session?.user) {
            setUser(session.user);
          }
          return;
        }

        if (event === 'SIGNED_IN') {
          console.log('✅ Login bem-sucedido:', session?.user?.email);
          if (session?.user) {
            setUser(session.user);
            const success = await loadUserData(session.user.id);
            if (!success) {
              console.warn('⚠️ Login OK mas perfil não carregou - fazendo logout');
              await supabase.auth.signOut();
              setUser(null);
              setPerfil(null);
              setUnidade(null);
              router.push('/login?error=profile_not_found');
            }
          }
          return;
        }

        if (event === 'USER_UPDATED') {
          console.log('👤 Dados do usuário atualizados');
          if (session?.user) {
            setUser(session.user);
            await loadUserData(session.user.id);
          }
          return;
        }

        // Para qualquer outro evento, mantém o estado atual se houver sessão
        if (session?.user) {
          console.log('ℹ️ Evento desconhecido mas sessão válida - mantendo estado');
          setUser(session.user);
        } else {
          console.warn('⚠️ Evento sem sessão:', event);
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
