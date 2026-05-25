import logo from './assets/logo.png'
export default function App() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-200 p-8">

        {/* Logo + Título */}
        <div className="flex flex-col items-center mb-8">

        <img
           src={logo}
           alt="Gap Selling Logo"
            className="w-28 h-28 object-contain"
          />

          <h1 className="text-5xl font-bold text-zinc-900 mt-6">
            Gap Selling
          </h1>

          <p className="text-zinc-500 mt-2 text-center">
            AI Sales Agent for Gyms
          </p>

        </div>

        {/* Formulário */}
        <div className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              E-mail
            </label>

            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full h-14 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Senha
            </label>

            <input
              type="password"
              placeholder="Sua senha"
              className="w-full h-14 px-4 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Botão Entrar */}
          <button
            className="w-full h-14 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white font-semibold text-lg hover:opacity-90 transition"
          >
            Entrar
          </button>

          {/* Criar conta */}
          <button
            className="w-full h-14 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition"
          >
            Criar conta
          </button>

          {/* Recuperar senha */}
          <button
            className="w-full h-14 rounded-xl border border-violet-500 text-violet-600 font-semibold hover:bg-violet-50 transition"
          >
            Recuperar senha
          </button>

        </div>

      </div>

    </div>
  )
}