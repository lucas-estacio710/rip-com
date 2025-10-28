'use client';

import { useEffect } from 'react';

export default function ResetPage() {
  useEffect(() => {
    // Limpar TUDO
    localStorage.clear();
    sessionStorage.clear();

    // Deletar TODOS os cookies do domínio
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Mostrar mensagem e redirecionar
    alert('Sessão completamente limpa! Você será redirecionado para o login.');
    window.location.href = '/login';
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">🔧 Limpando Sistema...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          Removendo cookies corrompidos...<br />
          Aguarde alguns segundos...
        </p>
      </div>
    </div>
  );
}
