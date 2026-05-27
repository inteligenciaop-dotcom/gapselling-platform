import PageHeader from '../components/layout/PageHeader'
import AcademyAvatar from '../components/layout/AcademyAvatar'
import { useAuth } from '../contexts/AuthContext'

export default function AcademySettings() {

  const { academy } = useAuth()

  return (
    <div>
      <PageHeader />

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 max-w-2xl">

        <h2 className="text-xl font-bold text-zinc-900 mb-2">
          Configurações da Academia
        </h2>

        <p className="text-zinc-500 mb-8">
          A logo exibida no dashboard será carregada aqui. Enquanto isso, usamos as iniciais da academia.
        </p>

        <div className="flex items-center gap-6 mb-8">
          <AcademyAvatar size="lg" />
          <div>
            <p className="font-semibold text-zinc-800">{academy?.name}</p>
            <p className="text-sm text-zinc-500">
              {academy?.logo_url ? 'Logo configurada' : 'Nenhuma logo enviada'}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-zinc-500 text-sm">
          Upload de logo — em breve nesta página
        </div>

      </div>
    </div>
  )
}
