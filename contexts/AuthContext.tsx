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
    console.error('🎯 loadUserData CHAMADO para userId:', userId);
    console.error('🔒 loadingUserDataRef.current ANTES:', loadingUserDataRef.current);

    // CRÍTICO: Configurar timeout ANTES de qualquer lógica
    // Se isso não executar, significa que a função nunca foi chamada
    const timeoutId = setTimeout(() => {
      console.error('⏰ TIMEOUT: loadUserData demorou mais de 10 segundos!');
      console.error('🚫 Forçando unlock do loadingUserDataRef');
      console.error('🔍 Estado atual - perfil:', perfil, 'unidade:', unidade);
      console.error('💡 Possível causa: RLS bloqueando query ou sessão inválida');
      loadingUserDataRef.current = false; // Force unlock
    }, 10000);

    console.error('⏱️ Timeout configurado com sucesso');

    // Evitar múltiplas chamadas simultâneas (problema do React Strict Mode)
    if (loadingUserDataRef.current) {
      console.error('⚠️ loadingUserDataRef travado! Alguém esqueceu de desbloquear.');
      console.error('⚠️ Forçando desbloqueio e continuando...');
      clearTimeout(timeoutId);
      loadingUserDataRef.current = false; // Force unlock
      // Não return - continuar com a execução
    }

    console.error('✅ Prosseguindo com loadUserData');
    loadingUserDataRef.current = true;

    // AbortController para cancelar queries que travam
    const abortController = new AbortController();

    try {
      console.log('📥 Carregando dados do usuário:', userId);

      // Verificar se a sessão ainda é válida antes de fazer queries
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('❌ Erro ao verificar sessão:', sessionError);
        clearTimeout(timeoutId);
        loadingUserDataRef.current = false;
        return;
      }

      if (!session) {
        console.warn('⚠️ Sem sessão ativa - abortando loadUserData');
        clearTimeout(timeoutId);
        loadingUserDataRef.current = false;
        return;
      }

      console.log('✅ Sessão válida, prosseguindo com queries');

      // Buscar perfil
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
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Se foi abortado pelo timeout, não fazer nada (já logamos acima)
      if (error?.name === 'AbortError') {
        console.log('🛑 Query abortada por timeout - mantendo dados antigos');
        return;
      }

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
