import { NavLink } from 'react-router-dom'
import gapLogo from '../../assets/logo.png'
import { navigationSections } from '../../config/navigation'
import { NavIcon } from '../icons/NavIcons'

export default function Sidebar() {
  return (
    <aside className="w-72 min-h-screen bg-white border-r border-zinc-200 flex flex-col shrink-0">

      <div className="px-6 pt-8 pb-6 flex flex-col items-center border-b border-zinc-100">
        <img
          src={gapLogo}
          alt="Gap Group"
          className="w-24 h-24 object-contain"
        />
        <p className="mt-3 text-2xl font-bold text-violet-700 tracking-tight">
          Gap Selling
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {navigationSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {section.title}
            </p>

            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-violet-100 text-violet-700'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      }`
                    }
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

    </aside>
  )
}
