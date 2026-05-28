import { useAuth } from '../../contexts/AuthContext'
import AcademyAvatar from './AcademyAvatar'

export default function PageHeader() {

  const { profile, academy } = useAuth()

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6 lg:mb-8">

      <AcademyAvatar size="lg" />

      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
          Bem-vindo 👋
        </h1>
        <p className="text-base sm:text-lg font-semibold text-zinc-800 mt-1 truncate">
          {profile?.login_name}
        </p>
        <p className="text-sm sm:text-base text-zinc-500 truncate">
          {academy?.name ?? 'Academia'}
        </p>
      </div>

    </div>
  )
}
