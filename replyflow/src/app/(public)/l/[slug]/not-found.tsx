import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl mb-4">🔍</span>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Perfil não encontrado</h1>
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        Este link de perfil não existe ou o estabelecimento ainda não tornou seu perfil público.
      </p>
      <Link
        href="/"
        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
      >
        Ir para ReplyFlow
      </Link>
    </div>
  );
}
