'use client';

import { useState, useEffect } from 'react';
import { Visita, CreateVisitaInput, UpdateVisitaInput } from '@/types/visitas';

interface VisitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visita: CreateVisitaInput | UpdateVisitaInput) => Promise<void>;
  visita?: Visita | null;
  estabelecimentoId?: string;
  unidadeId?: string;
}

export default function VisitaModal({
  isOpen,
  onClose,
  onSave,
  visita,
  estabelecimentoId,
  unidadeId,
}: VisitaModalProps) {
  const [loading, setLoading] = useState(false);
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    estabelecimento_id: estabelecimentoId || visita?.estabelecimento_id || '',
    data_visita: visita?.data_visita
      ? new Date(visita.data_visita).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16),
    tipo_visita: visita?.tipo_visita || 'presencial',
    objetivo: visita?.objetivo || '',
    status: visita?.status || 'realizada',
    contato_realizado: visita?.contato_realizado || '',
    cargo_contato: visita?.cargo_contato || '',
    observacoes: visita?.observacoes || '',
    proximos_passos: visita?.proximos_passos || '',
    data_proximo_contato: visita?.data_proximo_contato || '',
    temperatura_pos_visita: visita?.temperatura_pos_visita || '',
    potencial_negocio: visita?.potencial_negocio || '',
    duracao_minutos: visita?.duracao_minutos || '',
  });

  useEffect(() => {
    if (isOpen && !estabelecimentoId) {
      fetchEstabelecimentos();
    }
  }, [isOpen, estabelecimentoId]);

  const fetchEstabelecimentos = async () => {
    try {
      const response = await fetch('/api/estabelecimentos');
      if (response.ok) {
        const data = await response.json();
        setEstabelecimentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estabelecimentos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: any = { ...formData };

      // Adicionar unidade_id se estiver criando uma nova visita
      if (!visita && unidadeId) {
        submitData.unidade_id = unidadeId;
      }

      // Converter duracao_minutos para número
      if (submitData.duracao_minutos) {
        submitData.duracao_minutos = parseInt(submitData.duracao_minutos);
      }

      // Remover campos vazios
      Object.keys(submitData).forEach((key) => {
        if (submitData[key] === '' || submitData[key] === null) {
          delete submitData[key];
        }
      });

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar visita:', error);
      alert('Erro ao salvar visita. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {visita ? 'Editar Visita' : 'Nova Visita'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Estabelecimento */}
            {!estabelecimentoId && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Estabelecimento *
                </label>
                <select
                  value={formData.estabelecimento_id}
                  onChange={(e) =>
                    setFormData({ ...formData, estabelecimento_id: e.target.value })
                  }
                  required
                  disabled={!!visita}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Selecione um estabelecimento</option>
                  {estabelecimentos.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nome} - {est.cidade}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  value={formData.data_visita}
                  onChange={(e) =>
                    setFormData({ ...formData, data_visita: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Duração (minutos)
                </label>
                <input
                  type="number"
                  value={formData.duracao_minutos}
                  onChange={(e) =>
                    setFormData({ ...formData, duracao_minutos: e.target.value })
                  }
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Tipo e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo de Visita *
                </label>
                <select
                  value={formData.tipo_visita}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo_visita: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="presencial">Presencial</option>
                  <option value="online">Online</option>
                  <option value="telefonema">Telefonema</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="agendada">Agendada</option>
                  <option value="realizada">Realizada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="remarcada">Remarcada</option>
                </select>
              </div>
            </div>

            {/* Contato */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contato Realizado
                </label>
                <input
                  type="text"
                  value={formData.contato_realizado}
                  onChange={(e) =>
                    setFormData({ ...formData, contato_realizado: e.target.value })
                  }
                  placeholder="Nome da pessoa"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cargo do Contato
                </label>
                <input
                  type="text"
                  value={formData.cargo_contato}
                  onChange={(e) =>
                    setFormData({ ...formData, cargo_contato: e.target.value })
                  }
                  placeholder="Ex: Veterinário, Gerente"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            {/* Avaliação */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Temperatura Pós-Visita
                </label>
                <select
                  value={formData.temperatura_pos_visita}
                  onChange={(e) =>
                    setFormData({ ...formData, temperatura_pos_visita: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Selecione...</option>
                  <option value="quente">🔥 Quente</option>
                  <option value="morno">🌤️ Morno</option>
                  <option value="frio">❄️ Frio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Potencial de Negócio
                </label>
                <select
                  value={formData.potencial_negocio}
                  onChange={(e) =>
                    setFormData({ ...formData, potencial_negocio: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                >
                  <option value="">Selecione...</option>
                  <option value="alto">⭐ Alto</option>
                  <option value="medio">📊 Médio</option>
                  <option value="baixo">📉 Baixo</option>
                </select>
              </div>
            </div>

            {/* Objetivo */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Objetivo da Visita
              </label>
              <input
                type="text"
                value={formData.objetivo}
                onChange={(e) =>
                  setFormData({ ...formData, objetivo: e.target.value })
                }
                placeholder="Ex: Apresentação, Follow-up, Negociação"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={3}
                placeholder="Detalhes sobre a visita..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            {/* Próximos Passos */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Próximos Passos
              </label>
              <textarea
                value={formData.proximos_passos}
                onChange={(e) =>
                  setFormData({ ...formData, proximos_passos: e.target.value })
                }
                rows={2}
                placeholder="O que fazer a seguir..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            {/* Data Próximo Contato */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Data do Próximo Contato
              </label>
              <input
                type="date"
                value={formData.data_proximo_contato}
                onChange={(e) =>
                  setFormData({ ...formData, data_proximo_contato: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : visita ? 'Atualizar' : 'Criar Visita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
