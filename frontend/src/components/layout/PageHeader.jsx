import { useAuth } from '../../contexts/AuthContext'
import AcademyAvatar from './AcademyAvatar'

export default function PageHeader() {

  const { profile, academy } = useAuth()

  return (
    <div className="flex items-center gap-6 mb-8">

      <AcademyAvatar size="lg" />

      <div>
        <h1 className="text-3xl font-bold text-zinc-900">
          Bem-vindo 👋
        </h1>
        <p className="text-lg font-semibold text-zinc-800 mt-1">
          {profile?.login_name}
        </p>
        <p className="text-zinc-500">
          {academy?.name ?? 'Academia'}
        </p>
      </div>

    </div>
  )
}
