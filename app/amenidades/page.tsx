export default function AmenidadesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Amenidades</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Controle de estoque e histórico de amenidades
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Em Desenvolvimento</h3>
        <p className="text-gray-500">
          Funcionalidade de controle de amenidades será implementada em breve
        </p>
      </div>
    </div>
  );
}
