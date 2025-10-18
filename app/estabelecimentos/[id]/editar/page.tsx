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
