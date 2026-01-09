'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { EstabelecimentoTipo, NivelRelacionamento } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface PlaceResult {
  placeId: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  rating?: number;
  totalReviews?: number;
  tipos: string[];
  foto?: string;
}

interface PlaceDetails extends PlaceResult {
  telefone?: string;
  telefoneInternacional?: string;
  cep?: string;
  horarioFuncionamento?: string;
  website?: string;
  googleMapsUrl?: string;
  statusNegocio?: string;
  nivelPreco?: number;
  resumoEditorial?: string;
  fotos?: string[];
  avaliacoes?: {
    autor: string;
    nota: number;
    texto: string;
    tempo: string;
  }[];
}

export default function BuscarEstabelecimentoPage() {
  const router = useRouter();
  const { unidade } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [cidadeBusca, setCidadeBusca] = useState('Santos, SP');

  const cidadesBaixadaSantista = [
    'Santos, SP',
    'São Vicente, SP',
    'Guarujá, SP',
    'Cubatão, SP',
    'Praia Grande, SP',
    'Bertioga, SP',
    'Mongaguá, SP',
    'Itanhaém, SP',
    'Peruíbe, SP',
  ];

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [googleData, setGoogleData] = useState<PlaceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Campos editáveis do formulário
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [website, setWebsite] = useState('');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('');
  const [tipo, setTipo] = useState<EstabelecimentoTipo>('clinica');
  const [relacionamento, setRelacionamento] = useState<NivelRelacionamento>(0);
  const [observacoes, setObservacoes] = useState('');
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const [fotosDisponiveis, setFotosDisponiveis] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Novos campos de inteligência comercial
  const [porteEquipe, setPorteEquipe] = useState<string>('');
  const [veterinariosFixos, setVeterinariosFixos] = useState<string>('');
  const [veterinariosVolantes, setVeterinariosVolantes] = useState<string>('');
  const [ilhaDeExibicao, setIlhaDeExibicao] = useState<string[]>([]);
  const [politicaConcorrencia, setPoliticaConcorrencia] = useState<string>('');
  const [concorrentesPresentes, setConcorrentesPresentes] = useState<string[]>([]);
  const [qtdeMediaObitosMensal, setQtdeMediaObitosMensal] = useState<string>('');
  const [percentualPrefeitura, setPercentualPrefeitura] = useState<string>('');
  const [valorPrefeitura10kg, setValorPrefeitura10kg] = useState<string>('');
  const [modeloGratificacao, setModeloGratificacao] = useState<string>('');
  const [estrategia, setEstrategia] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setResults([]);
    setGoogleData(null);

    try {
      const response = await fetch(
        `/api/places/search?query=${encodeURIComponent(searchTerm)}&cidade=${encodeURIComponent(cidadeBusca)}`
      );

      if (!response.ok) throw new Error('Erro ao buscar');

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao buscar estabelecimentos.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: PlaceResult) => {
    setIsLoadingDetails(true);

    try {
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(place.placeId)}`
      );

      if (!response.ok) throw new Error('Erro ao buscar detalhes');

      const data = await response.json();
      const result = data.result;

      // Salva dados originais do Google
      setGoogleData(result);

      // Preenche campos editáveis
      setNome(result.nome || '');
      setEndereco(result.endereco || '');
      setBairro(result.bairro || '');
      setCidade(result.cidade || '');
      setEstado(result.estado || '');
      setCep(result.cep || '');
      setTelefone(result.telefone || '');
      setWebsite(result.website || '');
      setHorarioFuncionamento(result.horarioFuncionamento || '');
      setLatitude(result.latitude || null);
      setLongitude(result.longitude || null);

      // Fotos disponíveis
      const fotos = result.fotos || (result.foto ? [result.foto] : []);
      setFotosDisponiveis(fotos);
      setFotoSelecionada(fotos[0] || null);

      // Infere tipo
      const inferredTipo = inferTipo(result.tipos || [], result.nome || '');
      setTipo(inferredTipo);

      // Relacionamento padrão 0 (não pontuado)
      setRelacionamento(0);

    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      alert('Erro ao buscar detalhes do estabelecimento.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const inferTipo = (tipos: string[], nome: string): EstabelecimentoTipo => {
    const typesStr = tipos.join(' ').toLowerCase();
    const nomeStr = nome.toLowerCase();

    if (typesStr.includes('hospital') || nomeStr.includes('hospital') || nomeStr.includes('24h')) return 'hospital';
    if (typesStr.includes('veterinary') || nomeStr.includes('veterinár') || nomeStr.includes('clínica')) return 'clinica';
    if (typesStr.includes('pet_store') || nomeStr.includes('pet shop') || nomeStr.includes('petshop')) return 'petshop';
    if (nomeStr.includes('ração') || nomeStr.includes('racao')) return 'casa-racao';
    if (nomeStr.includes('laboratório') || nomeStr.includes('laboratorio')) return 'laboratorio';
    return 'clinica';
  };

  // Upload de foto do dispositivo
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);

    try {
      // Converte pra base64 e envia
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-foto-arquivo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFotoSelecionada(data.url);
        setFotosDisponiveis(prev => [data.url, ...prev]);
        alert('Foto enviada com sucesso!');
      } else {
        throw new Error('Falha no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar foto. Tente novamente.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

    setIsSaving(true);

    try {
      // Se a foto é do Google, faz upload pro Supabase
      let fotoFinal = fotoSelecionada;
      if (fotoSelecionada && fotoSelecionada.includes('googleapis.com')) {
        console.log('📸 Fazendo upload da foto do Google...');
        const uploadRes = await fetch('/api/upload-foto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fotoUrl: fotoSelecionada }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fotoFinal = uploadData.url;
          console.log('✅ Foto salva:', fotoFinal);
        }
      }

      const { createEstabelecimento } = await import('@/lib/db');

      const novoEstabelecimento = {
        unidade_id: unidade.id,
        nome,
        tipo,
        endereco,
        bairro: bairro || null,
        cidade,
        estado,
        cep: cep || null,
        telefone: telefone || null,
        email: null,
        website: website || null,
        instagram: null,
        whatsapp: null,
        horario_funcionamento: horarioFuncionamento || null,
        latitude,
        longitude,
        relacionamento,
        observacoes: observacoes || null,
        fotos: fotoFinal ? [fotoFinal] : null,
        ultima_visita: null,
        // Novos campos
        porte_equipe: porteEquipe || null,
        veterinarios_fixos: veterinariosFixos ? parseInt(veterinariosFixos) : null,
        veterinarios_volantes: veterinariosVolantes ? parseInt(veterinariosVolantes) : null,
        ilha_de_exibicao: ilhaDeExibicao.length > 0 ? ilhaDeExibicao : null,
        politica_concorrencia: politicaConcorrencia || null,
        concorrentes_presentes: concorrentesPresentes.length > 0 ? concorrentesPresentes : null,
        qtde_media_obitos_mensal: qtdeMediaObitosMensal ? parseInt(qtdeMediaObitosMensal) : null,
        percentual_prefeitura: percentualPrefeitura ? parseInt(percentualPrefeitura) : null,
        valor_prefeitura_10kg: valorPrefeitura10kg ? parseFloat(valorPrefeitura10kg) : null,
        modelo_gratificacao: modeloGratificacao || null,
        estrategia: estrategia || null,
      };

      const saved = await createEstabelecimento(novoEstabelecimento);

      if (saved) {
        alert('Estabelecimento adicionado com sucesso!');
        router.push('/estabelecimentos');
      } else {
        throw new Error('Erro ao salvar');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const voltarParaResultados = () => {
    setGoogleData(null);
    setNome('');
    setEndereco('');
    setBairro('');
    setCidade('');
    setEstado('');
    setCep('');
    setTelefone('');
    setWebsite('');
    setHorarioFuncionamento('');
    setFotoSelecionada(null);
    setFotosDisponiveis([]);
    setObservacoes('');
    // Limpar novos campos
    setPorteEquipe('');
    setVeterinariosFixos('');
    setVeterinariosVolantes('');
    setIlhaDeExibicao([]);
    setPoliticaConcorrencia('');
    setConcorrentesPresentes([]);
    setQtdeMediaObitosMensal('');
    setPercentualPrefeitura('');
    setValorPrefeitura10kg('');
    setModeloGratificacao('');
    setEstrategia('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Buscar Estabelecimento</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Pesquise pelo nome e adicione rapidamente</p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Nome do Estabelecimento</label>
              <input
                type="text"
                placeholder="Ex: Clínica Veterinária..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <select value={cidadeBusca} onChange={(e) => setCidadeBusca(e.target.value)} className="w-full">
                {cidadesBaixadaSantista.map((c) => (
                  <option key={c} value={c}>{c.replace(', SP', '')}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={isSearching} className="btn-primary">
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {results.length > 0 && !googleData && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Resultados ({results.length})</h2>
          <div className="space-y-3">
            {results.map((place) => (
              <div
                key={place.placeId}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => handleSelectPlace(place)}
              >
                {place.foto ? (
                  <img src={place.foto} alt={place.nome} className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl">🏥</span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold">{place.nome}</h3>
                  <p className="text-sm text-gray-600">{place.endereco}</p>
                  {place.rating && (
                    <p className="text-sm text-yellow-600">⭐ {place.rating.toFixed(1)} ({place.totalReviews} avaliações)</p>
                  )}
                </div>
                <span className="text-gray-400">→</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoadingDetails && (
        <div className="card text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando detalhes...</p>
        </div>
      )}

      {/* Form with Google Data */}
      {googleData && (
        <div className="space-y-6">
          {/* Dados do Google (somente leitura) */}
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-3">📍 Dados do Google Places</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Rating:</span>
                <p className="font-medium">{googleData.rating ? `⭐ ${googleData.rating.toFixed(1)}` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Avaliações:</span>
                <p className="font-medium">{googleData.totalReviews || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <p className="font-medium">{googleData.statusNegocio === 'OPERATIONAL' ? '✅ Aberto' : googleData.statusNegocio || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Nível Preço:</span>
                <p className="font-medium">{googleData.nivelPreco !== undefined ? '💰'.repeat(googleData.nivelPreco + 1) : 'N/A'}</p>
              </div>
              {googleData.resumoEditorial && (
                <div className="col-span-full">
                  <span className="text-gray-500">Resumo:</span>
                  <p className="font-medium">{googleData.resumoEditorial}</p>
                </div>
              )}
              {googleData.googleMapsUrl && (
                <div className="col-span-full">
                  <a href={googleData.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    🔗 Ver no Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Formulário Editável */}
          <div className="card">
            <h3 className="font-bold mb-4">✏️ Editar Informações</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna Esquerda - Foto e Dados Básicos */}
              <div className="space-y-4">
                {/* Seletor de Foto */}
                <div>
                  <label className="block text-sm font-medium mb-2">Foto</label>
                  <div className="space-y-3">
                    {fotoSelecionada ? (
                      <img src={fotoSelecionada} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">Sem foto</span>
                      </div>
                    )}

                    {/* Upload de arquivo */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {isUploadingPhoto ? '📤 Enviando...' : '📷 Tirar Foto / Escolher da Galeria'}
                    </button>

                    {/* Fotos do Google */}
                    {fotosDisponiveis.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Ou escolha uma foto do Google:</p>
                        <div className="grid grid-cols-4 gap-2">
                          {fotosDisponiveis.map((foto, i) => (
                            <img
                              key={i}
                              src={foto}
                              alt={`Foto ${i + 1}`}
                              className={`w-full h-16 object-cover rounded cursor-pointer border-2 ${
                                fotoSelecionada === foto ? 'border-primary' : 'border-transparent'
                              }`}
                              onClick={() => setFotoSelecionada(foto)}
                            />
                          ))}
                          <div
                            className={`w-full h-16 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer border-2 flex items-center justify-center ${
                              !fotoSelecionada ? 'border-primary' : 'border-transparent'
                            }`}
                            onClick={() => setFotoSelecionada(null)}
                          >
                            <span className="text-xs text-gray-500">Sem foto</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nome *</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full" required />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Endereço *</label>
                  <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full" required placeholder="Rua, número" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bairro</label>
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full" placeholder="Ex: Gonzaga" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Cidade</label>
                    <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Estado</label>
                    <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full" maxLength={2} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CEP</label>
                  <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} className="w-full" />
                </div>
              </div>

              {/* Coluna Direita - Contato e Classificação */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Horário de Funcionamento</label>
                  <textarea
                    value={horarioFuncionamento}
                    onChange={(e) => setHorarioFuncionamento(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value as EstabelecimentoTipo)} className="w-full">
                    <option value="clinica">Clínica</option>
                    <option value="hospital">Hospital</option>
                    <option value="petshop">Pet Shop</option>
                    <option value="casa-racao">Casa de Ração</option>
                    <option value="laboratorio">Laboratório</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Relacionamento Inicial</label>
                  <select
                    value={relacionamento}
                    onChange={(e) => setRelacionamento(Number(e.target.value) as NivelRelacionamento)}
                    className="w-full"
                  >
                    <option value={0}>☆☆☆☆☆ (Não pontuado)</option>
                    <option value={1}>★☆☆☆☆ (1 estrela)</option>
                    <option value={2}>★★☆☆☆ (2 estrelas)</option>
                    <option value={3}>★★★☆☆ (3 estrelas)</option>
                    <option value={4}>★★★★☆ (4 estrelas)</option>
                    <option value={5}>★★★★★ (5 estrelas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Observações</label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                    className="w-full"
                    placeholder="Anotações sobre o estabelecimento..."
                  />
                </div>
              </div>
            </div>

            {/* Seção: Equipe */}
            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">Equipe</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Porte da Equipe</label>
                  <select value={porteEquipe} onChange={(e) => setPorteEquipe(e.target.value)} className="w-full">
                    <option value="">Selecione...</option>
                    <option value="ate_5">Até 5 funcionários</option>
                    <option value="5_10">5 a 10 funcionários</option>
                    <option value="10_15">10 a 15 funcionários</option>
                    <option value="mais_15">Mais de 15 funcionários</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Veterinários Fixos</label>
                  <input type="number" min="0" value={veterinariosFixos} onChange={(e) => setVeterinariosFixos(e.target.value)} className="w-full" placeholder="Ex: 3" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Veterinários Volantes</label>
                  <input type="number" min="0" value={veterinariosVolantes} onChange={(e) => setVeterinariosVolantes(e.target.value)} className="w-full" placeholder="Ex: 2" />
                </div>
              </div>
            </div>

            {/* Seção: Material e Exibição */}
            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">Material e Exibição</h4>
              <div>
                <label className="block text-sm font-medium mb-2">Locais para Material de Divulgação</label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'recepcao', label: 'Recepção' },
                    { value: 'consultorios', label: 'Consultórios' },
                    { value: 'veterinarios', label: 'Direto com veterinários' },
                    { value: 'nenhum', label: 'Nenhum local' },
                  ].map((opcao) => (
                    <label key={opcao.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ilhaDeExibicao.includes(opcao.value)}
                        onChange={(e) => {
                          if (opcao.value === 'nenhum') {
                            setIlhaDeExibicao(e.target.checked ? ['nenhum'] : []);
                          } else {
                            if (e.target.checked) {
                              setIlhaDeExibicao(prev => [...prev.filter(v => v !== 'nenhum'), opcao.value]);
                            } else {
                              setIlhaDeExibicao(prev => prev.filter(v => v !== opcao.value));
                            }
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{opcao.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Seção: Concorrência */}
            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">Concorrência</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Política de Concorrência</label>
                  <select value={politicaConcorrencia} onChange={(e) => setPoliticaConcorrencia(e.target.value)} className="w-full">
                    <option value="">Selecione...</option>
                    <option value="aberto_todos">Aberto - aceita material de qualquer crematório</option>
                    <option value="seletivo">Seletivo - tem critérios para aceitar parceiros</option>
                    <option value="parceiro_exclusivo_nosso">Exclusivo conosco</option>
                    <option value="parceiro_exclusivo_outro">Exclusivo com outro crematório</option>
                    <option value="nao_indica">Não indica nenhum crematório</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Concorrentes Presentes</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'pet_memorial', label: 'Pet Memorial' },
                      { value: 'allma', label: 'Allma' },
                      { value: 'luna_pet', label: 'Luna Pet' },
                      { value: 'pet_assistencia', label: 'Pet Assistência' },
                      { value: 'eden_pet', label: 'Eden Pet' },
                      { value: 'mypetmemo', label: 'MyPetMemo' },
                    ].map((opcao) => (
                      <label key={opcao.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={concorrentesPresentes.includes(opcao.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConcorrentesPresentes(prev => [...prev, opcao.value]);
                            } else {
                              setConcorrentesPresentes(prev => prev.filter(v => v !== opcao.value));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{opcao.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Métricas de Óbitos */}
            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">Métricas de Óbitos</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Qtde Média de Óbitos/Mês</label>
                  <input type="number" min="0" value={qtdeMediaObitosMensal} onChange={(e) => setQtdeMediaObitosMensal(e.target.value)} className="w-full" placeholder="Ex: 15" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">% Prefeitura (descarte)</label>
                  <div className="relative">
                    <input type="number" min="0" max="100" value={percentualPrefeitura} onChange={(e) => setPercentualPrefeitura(e.target.value)} className="w-full pr-8" placeholder="Ex: 30" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valor Prefeitura (10kg)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                    <input type="number" min="0" step="0.01" value={valorPrefeitura10kg} onChange={(e) => setValorPrefeitura10kg(e.target.value)} className="w-full pl-10" placeholder="Ex: 150.00" />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Comercial */}
            <div className="border-t pt-6 mt-6">
              <h4 className="font-semibold mb-4">Comercial</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Modelo de Gratificação</label>
                  <select value={modeloGratificacao} onChange={(e) => setModeloGratificacao(e.target.value)} className="w-full">
                    <option value="">Selecione...</option>
                    <option value="direto_clinica">Direto para a clínica</option>
                    <option value="direto_veterinarios">Direto para os veterinários</option>
                    <option value="indireto_veterinarios">Indireto para veterinários</option>
                    <option value="brindes_tutores">Brindes para os tutores</option>
                    <option value="desconto_tutores">Desconto para os tutores</option>
                    <option value="nao_aceita">Não aceita gratificação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Estratégia</label>
                  <textarea value={estrategia} onChange={(e) => setEstrategia(e.target.value)} rows={3} className="w-full" placeholder="Ex: Ir conquistando aos poucos..." />
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-6 border-t mt-6">
              <button onClick={voltarParaResultados} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
                Voltar
              </button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 btn-primary">
                {isSaving ? 'Salvando...' : 'Salvar Estabelecimento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && !googleData && searchTerm && (
        <div className="card text-center py-12">
          <p className="text-gray-500">Nenhum resultado encontrado. Tente outro nome ou cidade.</p>
        </div>
      )}
    </div>
  );
}
