import { useAuth } from '../../contexts/AuthContext'

function getInitials(name) {
  if (!name) {
    return 'A'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function AcademyAvatar({ size = 'lg' }) {

  const { academy } = useAuth()

  const sizeClass = size === 'lg' ? 'w-28 h-28 text-2xl' : 'w-16 h-16 text-lg'

  if (academy?.logo_url) {
    return (
      <img
        src={academy.logo_url}
        alt={academy.name ?? 'Logo da academia'}
        className={`${sizeClass} rounded-full object-cover border-4 border-white shadow-md bg-white`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-violet-100 to-violet-200 border-4 border-white shadow-md flex items-center justify-center font-bold text-violet-700`}
    >
      {getInitials(academy?.name)}
    </div>
  )
}
