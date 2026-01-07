'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  cep?: string;
  horarioFuncionamento?: string;
  website?: string;
}

export default function BuscarEstabelecimentoPage() {
  const router = useRouter();
  const { unidade } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [cidade, setCidade] = useState('Santos, SP');

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
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [tipo, setTipo] = useState<EstabelecimentoTipo>('clinica');
  const [relacionamento, setRelacionamento] = useState<NivelRelacionamento>(1);
  const [observacoes, setObservacoes] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setResults([]);
    setSelectedPlace(null);

    try {
      const response = await fetch(
        `/api/places/search?query=${encodeURIComponent(searchTerm)}&cidade=${encodeURIComponent(cidade)}`
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar estabelecimentos');
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao buscar estabelecimentos. Verifique sua conexão e tente novamente.');
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

      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes');
      }

      const data = await response.json();
      setSelectedPlace(data.result);

      // Infere o tipo automaticamente
      const inferredTipo = inferTipo(data.result.tipos, data.result.nome);
      setTipo(inferredTipo);

      // Mapeia rating para relacionamento
      if (data.result.rating) {
        const inferredRelacionamento = mapRatingToRelacionamento(data.result.rating);
        setRelacionamento(inferredRelacionamento);
      }
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

    if (typesStr.includes('hospital') || nomeStr.includes('hospital') || nomeStr.includes('24h')) {
      return 'hospital';
    }
    if (typesStr.includes('veterinary') || nomeStr.includes('veterinár') || nomeStr.includes('clínica')) {
      return 'clinica';
    }
    if (typesStr.includes('pet_store') || nomeStr.includes('pet shop') || nomeStr.includes('petshop')) {
      return 'petshop';
    }
    if (nomeStr.includes('ração') || nomeStr.includes('racao')) {
      return 'casa-racao';
    }
    if (nomeStr.includes('laboratório') || nomeStr.includes('laboratorio')) {
      return 'laboratorio';
    }

    return 'clinica';
  };

  const mapRatingToRelacionamento = (rating: number): NivelRelacionamento => {
    if (rating >= 4.5) return 5;
    if (rating >= 3.5) return 4;
    if (rating >= 2.5) return 3;
    if (rating >= 1.5) return 2;
    return 1;
  };

  const handleSave = async () => {
    if (!selectedPlace) return;

    if (!unidade?.id) {
      alert('Erro: Unidade não encontrada. Faça login novamente.');
      return;
    }

    setIsSaving(true);

    try {
      // Importa função do banco
      const { createEstabelecimento } = await import('@/lib/db');

      // Cria novo estabelecimento
      const novoEstabelecimento = {
        unidade_id: unidade.id, // ✅ CRÍTICO: Necessário para RLS
        nome: selectedPlace.nome,
        tipo,
        endereco: selectedPlace.endereco,
        cidade: selectedPlace.cidade,
        estado: selectedPlace.estado,
        cep: selectedPlace.cep || null,
        telefone: selectedPlace.telefone || null,
        email: null,
        website: selectedPlace.website || null,
        instagram: null,
        whatsapp: null,
        horario_funcionamento: selectedPlace.horarioFuncionamento || null,
        latitude: selectedPlace.latitude || null,
        longitude: selectedPlace.longitude || null,
        relacionamento,
        observacoes: observacoes || null,
        fotos: selectedPlace.foto ? [selectedPlace.foto] : null,
        ultima_visita: null,
      };

      console.log('📝 Salvando estabelecimento:', novoEstabelecimento);

      // Salva no Supabase
      const saved = await createEstabelecimento(novoEstabelecimento);

      if (saved) {
        alert('Estabelecimento adicionado com sucesso!');
        router.push('/estabelecimentos');
      } else {
        throw new Error('Nenhum dado retornado do banco');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao salvar estabelecimento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Buscar Estabelecimento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Pesquise pelo nome e adicione rapidamente
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">
                Nome do Estabelecimento
              </label>
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
              <select
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full"
              >
                {cidadesBaixadaSantista.map((c) => (
                  <option key={c} value={c}>{c.replace(', SP', '')}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="btn-primary w-full md:w-auto"
          >
            {isSearching ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Buscando...
              </span>
            ) : (
              'Buscar'
            )}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {results.length > 0 && !selectedPlace && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            Resultados ({results.length})
          </h2>
          <div className="space-y-3">
            {results.map((place) => (
              <div
                key={place.placeId}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => handleSelectPlace(place)}
              >
                {place.foto ? (
                  <img
                    src={place.foto}
                    alt={place.nome}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-10 h-10 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{place.nome}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {place.endereco}
                  </p>
                  {place.rating && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(place.rating!)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {place.rating.toFixed(1)} ({place.totalReviews} avaliações)
                      </span>
                    </div>
                  )}
                </div>
                <svg
                  className="w-6 h-6 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Details */}
      {isLoadingDetails && (
        <div className="card text-center py-12">
          <svg
            className="animate-spin h-12 w-12 mx-auto mb-4 text-primary"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600">Carregando detalhes...</p>
        </div>
      )}

      {/* Selected Place Details */}
      {selectedPlace && (
        <div className="card">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-bold">Confirmar Informações</h2>
            <button
              onClick={() => setSelectedPlace(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Image and Basic Info */}
            <div className="space-y-4">
              {selectedPlace.foto && (
                <img
                  src={selectedPlace.foto}
                  alt={selectedPlace.nome}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="font-semibold text-lg">{selectedPlace.nome}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Endereço</label>
                  <p>{selectedPlace.endereco}</p>
                </div>

                {selectedPlace.telefone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p>{selectedPlace.telefone}</p>
                  </div>
                )}

                {selectedPlace.rating && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Avaliação Google</label>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{selectedPlace.rating.toFixed(1)}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(selectedPlace.rating!)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        ({selectedPlace.totalReviews} avaliações)
                      </span>
                    </div>
                  </div>
                )}

                {selectedPlace.horarioFuncionamento && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Horário</label>
                    <pre className="text-sm whitespace-pre-wrap">
                      {selectedPlace.horarioFuncionamento}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Form */}
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
                <select
                  value={relacionamento}
                  onChange={(e) => setRelacionamento(Number(e.target.value) as NivelRelacionamento)}
                  className="w-full"
                >
                  <option value="5">★★★★★ (5 estrelas)</option>
                  <option value="4">★★★★☆ (4 estrelas)</option>
                  <option value="3">★★★☆☆ (3 estrelas)</option>
                  <option value="2">★★☆☆☆ (2 estrelas)</option>
                  <option value="1">★☆☆☆☆ (1 estrela)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={4}
                  className="w-full"
                  placeholder="Anotações sobre o estabelecimento..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 btn-primary"
                >
                  {isSaving ? 'Salvando...' : 'Adicionar Estabelecimento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && !selectedPlace && searchTerm && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">
            Nenhum resultado encontrado
          </h3>
          <p className="text-gray-500">
            Tente buscar com outro nome ou cidade
          </p>
        </div>
      )}
    </div>
  );
}
