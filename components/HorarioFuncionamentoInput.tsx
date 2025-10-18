'use client';

import { useState } from 'react';

interface HorarioFuncionamentoInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function HorarioFuncionamentoInput({
  value,
  onChange,
}: HorarioFuncionamentoInputProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');

  const presets = [
    { label: '24 horas', value: '24h - Aberto todos os dias' },
    { label: 'Comercial (Seg-Sex 9h-18h)', value: 'Segunda a sexta das 9h às 18h' },
    { label: 'Comercial + Sábado manhã', value: 'Segunda a sexta das 9h às 18h, Sábado das 9h às 12h' },
    { label: 'Comercial + Sábado', value: 'Segunda a sábado das 9h às 18h' },
    { label: 'Meio período (Seg-Sex 9h-13h)', value: 'Segunda a sexta das 9h às 13h' },
    { label: 'Tarde/Noite (Seg-Sex 14h-22h)', value: 'Segunda a sexta das 14h às 22h' },
  ];

  const handlePresetClick = (presetValue: string) => {
    onChange(presetValue);
  };

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode('preset')}
          className={`px-3 py-1 rounded ${
            mode === 'preset'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Modelos Prontos
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`px-3 py-1 rounded ${
            mode === 'custom'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Personalizado
        </button>
      </div>

      {/* Presets */}
      {mode === 'preset' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                value === preset.value
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="font-medium text-sm">{preset.label}</div>
              <div className="text-xs text-gray-500 mt-1">{preset.value}</div>
            </button>
          ))}
        </div>
      )}

      {/* Custom Input */}
      {mode === 'custom' && (
        <div className="space-y-2">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ex: Segunda a sexta das 9h às 18h, Sábado das 9h às 12h"
            className="w-full min-h-[80px]"
          />
          <p className="text-xs text-gray-500">
            💡 Dicas: "24h", "Segunda a sexta das 8h às 20h", "Seg-Sáb 9h-18h"
          </p>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 mb-1">Como vai aparecer:</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      )}
    </div>
  );
}
