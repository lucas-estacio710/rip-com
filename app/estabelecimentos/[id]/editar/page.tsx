'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { EstabelecimentoTipo, NivelRelacionamento } from '@/types';
import type { Estabelecimento } from '@/lib/supabase';
import HorarioFuncionamentoInput from '@/components/HorarioFuncionamentoInput';

export default function EditarEstabelecimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fotoAtual, setFotoAtual] = useState<string | null>(null);
  const [buscandoFotos, setBuscandoFotos] = useState(false);
  const [fotosDisponiveis, setFotosDisponiveis] = useState<{url: string, tipo: string}[]>([]);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Form fields
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('Santos');
  const [estado, setEstado] = useState('SP');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [instagram, setInstagram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState('');
  const [tipo, setTipo] = useState<EstabelecimentoTipo>('clinica');
  const [relacionamento, setRelacionamento] = useState<NivelRelacionamento>(0);
  const [observacoes, setObservacoes] = useState('');

  // Carregar dados do estabelecimento
  useEffect(() => {
    async function loadEstabelecimento() {
      try {
        const { getEstabelecimentoById } = await import('@/lib/db');
        const data = await getEstabelecimentoById(id);

        if (data) {
          setNome(data.nome);
          setEndereco(data.endereco);
          setCidade(data.cidade);
          setEstado(data.estado);
          setCep(data.cep || '');
          setTelefone(data.telefone || '');
          setEmail(data.email || '');
          setInstagram(data.instagram || '');
          setWhatsapp(data.whatsapp || '');
          setHorarioFuncionamento(data.horario_funcionamento || '');
          setTipo(data.tipo);
          setRelacionamento(data.relacionamento as NivelRelacionamento);
          setObservacoes(data.observacoes || '');
          // Foto e coordenadas
          if (data.fotos && data.fotos.length > 0) {
            setFotoAtual(data.fotos[0]);
            setFotoSelecionada(data.fotos[0]);
          }
          setLatitude(data.latitude || null);
          setLongitude(data.longitude || null);
        }
      } catch (error) {
        console.error('Erro ao carregar estabelecimento:', error);
        alert('Erro ao carregar dados do estabelecimento');
      } finally {
        setLoading(false);
      }
    }
    loadEstabelecimento();
  }, [id]);

  // Buscar fotos do Google Places
  const buscarFotos = async () => {
    setBuscandoFotos(true);
    setFotosDisponiveis([]);

    try {
      // Busca pelo nome + cidade
      const searchQuery = `${nome} ${cidade}, ${estado}`;
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(searchQuery)}&cidade=${encodeURIComponent(cidade + ', ' + estado)}`);

      if (!response.ok) throw new Error('Erro na busca');

      const data = await response.json();
      const fotos: {url: string, tipo: string}[] = [];

      // Adiciona fotos dos resultados
      if (data.results && data.results.length > 0) {
        // Busca detalhes do primeiro resultado para pegar mais fotos
        const placeId = data.results[0].placeId;
        const detailsRes = await fetch(`/api/places/details?placeId=${encodeURIComponent(placeId)}`);

        if (detailsRes.ok) {
          const detailsData = await detailsRes.json();
          if (detailsData.result?.fotos) {
            detailsData.result.fotos.forEach((url: string, index: number) => {
              fotos.push({ url, tipo: `Foto ${index + 1}` });
            });
          } else if (detailsData.result?.foto) {
            fotos.push({ url: detailsData.result.foto, tipo: 'Google Places' });
          }
        }

        // Adiciona fotos dos outros resultados
        data.results.slice(0, 5).forEach((result: any, index: number) => {
          if (result.foto) {
            fotos.push({ url: result.foto, tipo: `Resultado ${index + 1}` });
          }
        });
      }

      setFotosDisponiveis(fotos);
    } catch (error) {
      console.error('Erro ao buscar fotos:', error);
      alert('Erro ao buscar fotos. Tente novamente.');
    } finally {
      setBuscandoFotos(false);
    }
  };

  const handleSave = async () => {
    if (!nome || !endereco) {
      alert('Nome e endereço são obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const { updateEstabelecimento } = await import('@/lib/db');

      const updated = await updateEstabelecimento(id, {
        nome,
        tipo,
        endereco,
        cidade,
        estado,
        cep: cep || null,
        telefone: telefone || null,
        email: email || null,
        instagram: instagram || null,
        whatsapp: whatsapp || null,
        horario_funcionamento: horarioFuncionamento || null,
        relacionamento,
        observacoes: observacoes || null,
        fotos: fotoSelecionada ? [fotoSelecionada] : null,
      });

      if (updated) {
        alert('Estabelecimento atualizado com sucesso!');
        router.push(`/estabelecimentos/${id}`);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar estabelecimento');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p className="text-gray-500">Carregando estabelecimento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Link
            href={`/estabelecimentos/${id}`}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Editar Estabelecimento</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{nome}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card">
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
                className="w-full"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
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
              <label className="block text-sm font-medium mb-2">CEP</label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(13) 99999-9999"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@exemplo.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@usuario ou https://instagram.com/usuario"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="5513999999999"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Formato: 55 + DDD + Número (sem espaços ou símbolos)</p>
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
            {/* Seção de Foto */}
            <div>
              <label className="block text-sm font-medium mb-2">Foto do Estabelecimento</label>

              {/* Foto atual */}
              <div className="mb-3">
                {fotoSelecionada ? (
                  <img
                    src={fotoSelecionada}
                    alt={nome}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Sem foto</span>
                  </div>
                )}
              </div>

              {/* Botão buscar fotos */}
              <button
                type="button"
                onClick={buscarFotos}
                disabled={buscandoFotos}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {buscandoFotos ? 'Buscando fotos...' : 'Buscar Novas Fotos'}
              </button>

              {/* Grid de fotos disponíveis */}
              {fotosDisponiveis.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Selecione uma foto:
                  </p>
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {fotosDisponiveis.map((foto, index) => (
                      <div
                        key={index}
                        onClick={() => setFotoSelecionada(foto.url)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          fotoSelecionada === foto.url
                            ? 'border-primary ring-2 ring-primary'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                        }`}
                      >
                        <img
                          src={foto.url}
                          alt={foto.tipo}
                          className="w-full h-20 object-cover"
                        />
                        <div className={`text-xs text-center py-1 ${
                          fotoSelecionada === foto.url
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          {foto.tipo}
                        </div>
                      </div>
                    ))}
                    {/* Opção sem foto */}
                    <div
                      onClick={() => setFotoSelecionada(null)}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        !fotoSelecionada
                          ? 'border-primary ring-2 ring-primary'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                      }`}
                    >
                      <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className={`text-xs text-center py-1 ${
                        !fotoSelecionada
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        Sem foto
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                Relacionamento
              </label>
              <select
                value={relacionamento}
                onChange={(e) => setRelacionamento(Number(e.target.value) as NivelRelacionamento)}
                className="w-full"
              >
                <option value={0}>☆☆☆☆☆ (Não pontuado)</option>
                <option value={1}>★☆☆☆☆ (1 estrela - Frio)</option>
                <option value={2}>★★☆☆☆ (2 estrelas - Morno)</option>
                <option value={3}>★★★☆☆ (3 estrelas - Regular)</option>
                <option value={4}>★★★★☆ (4 estrelas - Bom)</option>
                <option value={5}>★★★★★ (5 estrelas - Excelente)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={10}
                className="w-full"
                placeholder="Anotações sobre o estabelecimento..."
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t mt-6">
          <Link
            href={`/estabelecimentos/${id}`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
