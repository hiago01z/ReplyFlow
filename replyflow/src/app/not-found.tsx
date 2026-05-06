import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-indigo-100 mb-2 leading-none">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Ir para o dashboard
          </Link>
          <Link
            href="/"
            className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
