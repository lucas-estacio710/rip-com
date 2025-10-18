export default function VisitasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Visitas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Histórico completo de todas as visitas realizadas
        </p>
      </div>

      <div className="card text-center py-12">
        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Em Desenvolvimento</h3>
        <p className="text-gray-500">
          Histórico de visitas será implementado em breve
        </p>
      </div>
    </div>
  );
}
