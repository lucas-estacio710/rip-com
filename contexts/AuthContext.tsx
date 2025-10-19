'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
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

  // Flag para evitar múltiplas chamadas simultâneas
  const loadingUserDataRef = useRef(false);

  // Carrega perfil e unidade do usuário
  const loadUserData = async (userId: string) => {
    // Evitar múltiplas chamadas simultâneas (problema do React Strict Mode)
    if (loadingUserDataRef.current) {
      console.log('⚠️ Já está carregando dados do usuário, pulando...');
      return;
    }

    loadingUserDataRef.current = true;

    try {
      console.log('📥 Carregando dados do usuário:', userId);

      // Buscar perfil - Testando com novo cliente
      console.log('🔍 Buscando perfil...');
      const startTimePerfil = Date.now();

      const { data: perfilData, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const durationPerfil = Date.now() - startTimePerfil;
      console.log(`⏱️ Query de perfil completou em ${durationPerfil}ms`);
      console.log('👤 Perfil resultado:', { perfilData, perfilError });

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
      console.log('✅ Perfil definido!');

      // Buscar unidade se o perfil tiver uma
      if (perfilData?.unidade_id) {
        console.log('🔍 Buscando unidade...');
        const startTime = Date.now();

        const { data: unidadeData, error: unidadeError } = await supabase
          .from('unidades')
          .select('*')
          .eq('id', perfilData.unidade_id)
          .maybeSingle();

        const duration = Date.now() - startTime;
        console.log(`⏱️ Query de unidade completou em ${duration}ms`);

        if (unidadeError) {
          console.error('❌ Erro ao carregar unidade:', unidadeError);
        } else if (unidadeData) {
          setUnidade(unidadeData);
          console.log('✅ Unidade carregada:', unidadeData.nome);
        } else {
          console.warn('⚠️ Unidade não encontrada');
        }
      } else {
        console.warn('⚠️ Perfil sem unidade associada');
      }

      console.log('✅ Dados do usuário carregados!');
    } catch (error) {
      console.error('💥 Erro crítico ao carregar dados do usuário:', error);
      // Define valores null para desbloquear a UI
      setPerfil(null);
      setUnidade(null);
    } finally {
      loadingUserDataRef.current = false;
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
        setUser(data.user);
        await loadUserData(data.user.id);
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
