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
  const [enviandoFoto, setEnviandoFoto] = useState(false);

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
          // Novos campos
          setPorteEquipe(data.porte_equipe || '');
          setVeterinariosFixos(data.veterinarios_fixos?.toString() || '');
          setVeterinariosVolantes(data.veterinarios_volantes?.toString() || '');
          setIlhaDeExibicao(data.ilha_de_exibicao || []);
          setPoliticaConcorrencia(data.politica_concorrencia || '');
          setConcorrentesPresentes(data.concorrentes_presentes || []);
          setQtdeMediaObitosMensal(data.qtde_media_obitos_mensal?.toString() || '');
          setPercentualPrefeitura(data.percentual_prefeitura?.toString() || '');
          setValorPrefeitura10kg(data.valor_prefeitura_10kg?.toString() || '');
          setModeloGratificacao(data.modelo_gratificacao || '');
          setEstrategia(data.estrategia || '');
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

  // Upload de foto do dispositivo (câmera/galeria)
  const handleFotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Valida tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    // Valida tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem.');
      return;
    }

    setEnviandoFoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('estabelecimentoId', id);

      const response = await fetch('/api/upload-foto-arquivo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const data = await response.json();
      setFotoSelecionada(data.url);
      console.log(`📸 Foto enviada: ${Math.round(data.originalSize/1024)}KB → ${Math.round(data.optimizedSize/1024)}KB`);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar foto. Tente novamente.');
    } finally {
      setEnviandoFoto(false);
    }
  };

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
      // Se a foto mudou e é do Google, faz upload pro Supabase Storage
      let fotoFinal = fotoSelecionada;
      if (fotoSelecionada && fotoSelecionada !== fotoAtual) {
        // Só faz upload se for URL do Google (não do Supabase)
        if (fotoSelecionada.includes('googleapis.com')) {
          console.log('📸 Fazendo upload da nova foto...');
          const uploadRes = await fetch('/api/upload-foto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fotoUrl: fotoSelecionada, estabelecimentoId: id }),
          });

          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            fotoFinal = uploadData.url;
            console.log('✅ Foto salva no Supabase:', fotoFinal);
          } else {
            console.warn('⚠️ Falha no upload, mantendo foto anterior');
            fotoFinal = fotoAtual;
          }
        }
      }

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
        fotos: fotoFinal ? [fotoFinal] : null,
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

              {/* Botões de ação para foto */}
              <div className="flex flex-col gap-2">
                {/* Upload de foto do dispositivo */}
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFotoUpload}
                      disabled={enviandoFoto}
                      className="hidden"
                    />
                    <div className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center transition-colors ${
                      enviandoFoto
                        ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                    }`}>
                      {enviandoFoto ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Enviando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Câmera
                        </span>
                      )}
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFotoUpload}
                      disabled={enviandoFoto}
                      className="hidden"
                    />
                    <div className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center transition-colors ${
                      enviandoFoto
                        ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                    }`}>
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Galeria
                      </span>
                    </div>
                  </label>
                </div>

                {/* Buscar fotos do Google */}
                <button
                  type="button"
                  onClick={buscarFotos}
                  disabled={buscandoFotos}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {buscandoFotos ? 'Buscando fotos...' : 'Buscar no Google Places'}
                </button>
              </div>

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
                rows={4}
                className="w-full"
                placeholder="Anotações sobre o estabelecimento..."
              />
            </div>
          </div>
        </div>

        {/* Seção: Equipe */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Equipe</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Porte da Equipe</label>
              <select
                value={porteEquipe}
                onChange={(e) => setPorteEquipe(e.target.value)}
                className="w-full"
              >
                <option value="">Selecione...</option>
                <option value="ate_5">Até 5 funcionários</option>
                <option value="5_10">5 a 10 funcionários</option>
                <option value="10_15">10 a 15 funcionários</option>
                <option value="mais_15">Mais de 15 funcionários</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Veterinários Fixos</label>
              <input
                type="number"
                min="0"
                value={veterinariosFixos}
                onChange={(e) => setVeterinariosFixos(e.target.value)}
                className="w-full"
                placeholder="Ex: 3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Veterinários Volantes</label>
              <input
                type="number"
                min="0"
                value={veterinariosVolantes}
                onChange={(e) => setVeterinariosVolantes(e.target.value)}
                className="w-full"
                placeholder="Ex: 2"
              />
            </div>
          </div>
        </div>

        {/* Seção: Material e Exibição */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Material e Exibição</h3>
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
          <h3 className="text-lg font-semibold mb-4">Concorrência</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Política de Concorrência</label>
              <select
                value={politicaConcorrencia}
                onChange={(e) => setPoliticaConcorrencia(e.target.value)}
                className="w-full"
              >
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
          <h3 className="text-lg font-semibold mb-4">Métricas de Óbitos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Qtde Média de Óbitos/Mês</label>
              <input
                type="number"
                min="0"
                value={qtdeMediaObitosMensal}
                onChange={(e) => setQtdeMediaObitosMensal(e.target.value)}
                className="w-full"
                placeholder="Ex: 15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">% Prefeitura (descarte)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={percentualPrefeitura}
                  onChange={(e) => setPercentualPrefeitura(e.target.value)}
                  className="w-full pr-8"
                  placeholder="Ex: 30"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Valor Prefeitura (10kg)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorPrefeitura10kg}
                  onChange={(e) => setValorPrefeitura10kg(e.target.value)}
                  className="w-full pl-10"
                  placeholder="Ex: 150.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção: Comercial */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Comercial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Modelo de Gratificação</label>
              <select
                value={modeloGratificacao}
                onChange={(e) => setModeloGratificacao(e.target.value)}
                className="w-full"
              >
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
              <textarea
                value={estrategia}
                onChange={(e) => setEstrategia(e.target.value)}
                rows={3}
                className="w-full"
                placeholder="Ex: Ir conquistando aos poucos, manter relacionamento com a recepção..."
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
