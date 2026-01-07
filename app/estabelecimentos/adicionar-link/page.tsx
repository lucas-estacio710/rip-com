'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { EstabelecimentoTipo, NivelRelacionamento } from '@/types';
import HorarioFuncionamentoInput from '@/components/HorarioFuncionamentoInput';
import { useAuth } from '@/contexts/AuthContext';

function AdicionarPorLinkContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { unidade } = useAuth();
  const [googleUrl, setGoogleUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Form fields
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('Santos');
  const [estado, setEstado] = useState('SP');
  const [telefone, setTelefone] = useState('');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('');
  const [tipo, setTipo] = useState<EstabelecimentoTipo>('clinica');
  const [relacionamento] = useState<NivelRelacionamento>(0); // Sempre inicia com 0 estrelas (não pontuado)
  const [observacoes, setObservacoes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [latitude, setLatitude] = useState<number>();
  const [longitude, setLongitude] = useState<number>();
  const [extractedRating, setExtractedRating] = useState<number>();
  const [fotoUrl, setFotoUrl] = useState<string>();

  // Processa URL compartilhada
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      setGoogleUrl(decodeURIComponent(urlParam));
      // Extrai automaticamente quando recebe URL por parâmetro
      setTimeout(() => {
        handleExtractFromUrl();
      }, 500);
    }
  }, [searchParams]);

  const extractPlaceIdFromUrl = (url: string): string | null => {
    // Tenta extrair place_id de diferentes formatos de URL do Google Maps

    // Formato 1: https://www.google.com/maps/place/.../@lat,lng,zoom/data=!3m1!4b1!4m6!3m5!1s0xABCDEF:0x123456!...
    const placeIdMatch1 = url.match(/!1s([^!]+)/);
    if (placeIdMatch1) return placeIdMatch1[1];

    // Formato 2: https://maps.app.goo.gl/XXXXX (short URL)
    const shortUrlMatch = url.match(/goo\.gl\/([A-Za-z0-9]+)/);
    if (shortUrlMatch) return shortUrlMatch[1];

    // Formato 3: place_id direto na URL
    const placeIdMatch2 = url.match(/place_id=([^&]+)/);
    if (placeIdMatch2) return placeIdMatch2[1];

    return null;
  };

  const extractInfoFromUrl = (url: string) => {
    // Tenta extrair nome do lugar da URL
    // Formato: https://www.google.com/maps/place/Nome+Do+Lugar/...
    const nameMatch = url.match(/\/place\/([^/@]+)/);
    if (nameMatch) {
      const extractedName = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
      setNome(extractedName);
    }

    // Extrai coordenadas se disponível
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      // Coordenadas extraídas com sucesso
      console.log('Coordenadas:', coordMatch[1], coordMatch[2]);
      // Você pode salvar essas coordenadas se quiser
    }
  };

  const mapRatingToRelacionamento = (rating: number): NivelRelacionamento => {
    if (rating >= 4.5) return 5;
    if (rating >= 3.5) return 4;
    if (rating >= 2.5) return 3;
    if (rating >= 1.5) return 2;
    return 1;
  };

  const inferTipo = (nome: string, googleType?: string): EstabelecimentoTipo => {
    const text = `${nome} ${googleType || ''}`.toLowerCase();

    if (text.includes('hospital') || text.includes('24h') || text.includes('emergência')) {
      return 'hospital';
    }
    if (text.includes('clínica') || text.includes('veterinár')) {
      return 'clinica';
    }
    if (text.includes('pet shop') || text.includes('petshop') || text.includes('banho') || text.includes('tosa')) {
      return 'petshop';
    }
    if (text.includes('ração') || text.includes('racao')) {
      return 'casa-racao';
    }
    if (text.includes('laboratório') || text.includes('laboratorio')) {
      return 'laboratorio';
    }

    return 'clinica';
  };

  const handleExtractFromUrl = async () => {
    if (!googleUrl.trim()) {
      alert('Por favor, cole o link do Google Maps');
      return;
    }

    setIsExtracting(true);

    try {
      // Chama a API de scraping
      const response = await fetch('/api/scrape-maps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: googleUrl }),
      });

      if (!response.ok) {
        throw new Error('Erro ao extrair dados');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;

        // Preenche os campos automaticamente
        if (data.nome) setNome(data.nome);
        if (data.endereco) setEndereco(data.endereco);
        if (data.cidade) setCidade(data.cidade);
        if (data.estado) setEstado(data.estado);
        if (data.telefone) setTelefone(data.telefone);
        if (data.horarioFuncionamento) setHorarioFuncionamento(data.horarioFuncionamento);
        if (data.latitude) setLatitude(data.latitude);
        if (data.longitude) setLongitude(data.longitude);
        // Prioriza Street View sobre foto do Google Places
        if (data.streetViewUrl) {
          setFotoUrl(data.streetViewUrl);
        } else if (data.fotoUrl) {
          setFotoUrl(data.fotoUrl);
        }

        // Infere o tipo
        if (data.nome) {
          const inferredTipo = inferTipo(data.nome, data.googleType);
          setTipo(inferredTipo);
        }

        // Salva o rating do Google apenas para exibição (não afeta relacionamento)
        if (data.rating) {
          setExtractedRating(data.rating);
        }

        setShowForm(true);

        // Scrolla para o formulário
        setTimeout(() => {
          document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        throw new Error('Nenhum dado extraído');
      }
    } catch (error) {
      console.error('Erro ao extrair informações:', error);
      alert('Não foi possível extrair informações automaticamente. O formulário foi aberto para preenchimento manual.');

      // Abre o formulário vazio para preenchimento manual
      setShowForm(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!nome || !endereco) {
      alert('Nome e endereço são obrigatórios');
      return;
    }

    if (!unidade?.id) {
      alert('Erro: Unidade não encontrada. Faça login novamente.');
      return;
    }

    try {
      console.log('🔄 Iniciando salvamento...');

      // Importa função do banco
      console.log('📦 Importando função createEstabelecimento...');
      const { createEstabelecimento } = await import('@/lib/db');
      console.log('✅ Função importada');

      // Cria novo estabelecimento
      const novoEstabelecimento = {
        unidade_id: unidade.id, // ✅ CRÍTICO: Necessário para RLS
        nome,
        tipo,
        endereco,
        cidade,
        estado,
        cep: null,
        telefone: telefone || null,
        email: null,
        website: null,
        instagram: null,
        whatsapp: null,
        horario_funcionamento: horarioFuncionamento || null,
        latitude: latitude || null,
        longitude: longitude || null,
        relacionamento,
        observacoes: observacoes || null,
        fotos: fotoUrl ? [fotoUrl] : null,
        ultima_visita: null,
      };

      console.log('📝 Dados a serem salvos:', novoEstabelecimento);

      // Timeout wrapper - 30 segundos
      console.log('⏱️ Iniciando salvamento com timeout de 30s...');
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: operação demorou mais de 30 segundos')), 30000)
      );

      // Salva no Supabase com timeout
      const saved = await Promise.race([
        createEstabelecimento(novoEstabelecimento),
        timeoutPromise
      ]);

      console.log('✅ Resultado:', saved);

      if (saved) {
        console.log('🎉 Estabelecimento salvo com sucesso!');
        alert('Estabelecimento adicionado com sucesso!');
        router.push('/estabelecimentos');
      } else {
        throw new Error('Nenhum dado retornado do banco');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      alert(`Erro ao salvar estabelecimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Adicionar Estabelecimento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Cole o link do Google Maps
        </p>
      </div>

      {/* URL Input */}
      <div className="card">
        <div className="flex gap-3">
          <input
            type="url"
            placeholder="Cole o link do Google Maps aqui..."
            value={googleUrl}
            onChange={(e) => setGoogleUrl(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <button
            onClick={handleExtractFromUrl}
            disabled={isExtracting}
            className="btn-primary px-8 whitespace-nowrap"
          >
            {isExtracting ? 'Extraindo...' : 'Continuar'}
          </button>
        </div>
      </div>

      {/* Success Alert - Dados Extraídos */}
      {showForm && (nome || endereco || telefone) && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex gap-3">
            <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-green-900 dark:text-green-100">Dados extraídos com sucesso!</p>
              <div className="mt-2 text-sm text-green-800 dark:text-green-200 space-y-1">
                {nome && <p>✓ Nome: {nome}</p>}
                {endereco && <p>✓ Endereço: {endereco}</p>}
                {telefone && <p>✓ Telefone: {telefone}</p>}
                {horarioFuncionamento && <p>✓ Horário: {horarioFuncionamento}</p>}
                {latitude && longitude && <p>✓ Coordenadas: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>}
                {extractedRating && <p>✓ Avaliação Google: {extractedRating} estrelas</p>}
                {fotoUrl && <p>✓ Foto do Street View extraída</p>}
              </div>
              {fotoUrl && (
                <div className="mt-3">
                  <img
                    src={fotoUrl}
                    alt={nome}
                    className="w-full max-w-sm rounded-lg border-2 border-green-300 dark:border-green-700"
                  />
                </div>
              )}
              <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                Confira os dados abaixo e ajuste se necessário antes de salvar. O relacionamento começa com 1 estrela (frio) - você atualiza conforme evolui o relacionamento.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div id="form-section" className="card">
          <h2 className="text-xl font-bold mb-6">Confirme as informações</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Clínica Veterinária Pet Life"
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Ex: Rua João Guerra, 319"
                  className="w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Estado
                  </label>
                  <input
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                    maxLength={2}
                    className="w-full uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(13) 99999-9999"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Horário de Funcionamento
                </label>
                <HorarioFuncionamentoInput
                  value={horarioFuncionamento}
                  onChange={setHorarioFuncionamento}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tipo de Estabelecimento
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as EstabelecimentoTipo)}
                  className="w-full"
                >
                  <option value="clinica">Clínica</option>
                  <option value="hospital">Hospital</option>
                  <option value="petshop">Pet Shop</option>
                  <option value="casa-racao">Casa de Ração</option>
                  <option value="laboratorio">Laboratório</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Relacionamento Inicial
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">☆☆☆☆☆ (Não pontuado)</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Padrão</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Novos estabelecimentos não têm pontuação. Você atualiza o relacionamento após visitas e interações.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={6}
                  className="w-full"
                  placeholder="Anotações sobre o estabelecimento..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t mt-6">
            <button
              onClick={() => router.push('/estabelecimentos')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 btn-primary"
            >
              Adicionar Estabelecimento
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AdicionarPorLinkPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p className="text-gray-500">Carregando...</p>
      </div>
    }>
      <AdicionarPorLinkContent />
    </Suspense>
  );
}
