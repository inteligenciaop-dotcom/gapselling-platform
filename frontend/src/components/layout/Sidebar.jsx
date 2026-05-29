import { NavLink } from 'react-router-dom'

import gapLogo from '../../assets/logo.png'
import { useAcademySetup } from '../../contexts/AcademySetupContext'
import { navigationSections } from '../../config/navigation'
import { NavIcon } from '../icons/NavIcons'

function SidebarContent({ onNavigate, showCloseButton, onClose, setupComplete }) {
  return (
    <>
      <div className="relative px-6 pt-6 lg:pt-8 pb-6 flex items-center justify-between border-b border-zinc-100">
        <div className="flex flex-col items-center flex-1">
          <img
            src={gapLogo}
            alt="Gap Group"
            className="w-20 h-20 lg:w-24 lg:h-24 object-contain"
          />
          <p className="mt-3 text-xl lg:text-2xl font-bold text-violet-700 tracking-tight">
            Gap Selling
          </p>
        </div>

        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="absolute top-4 right-4 w-10 h-10 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 text-2xl leading-none"
          >
            ×
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {!setupComplete && (
          <NavLink
            to="/onboarding/setup"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`
            }
          >
            <span className="text-base">📋</span>
            Guia de configuração
          </NavLink>
        )}

        {navigationSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {section.title}
            </p>

            <ul className="space-y-1">
              {section.items.map((item) => {
                const locked = item.requiresSetup && !setupComplete

                if (locked) {
                  return (
                    <li key={item.path}>
                      <span
                        title="Complete a configuração da academia para acessar"
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-zinc-400 cursor-not-allowed"
                      >
                        <NavIcon name={item.icon} />
                        {item.label}
                        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                          Bloq.
                        </span>
                      </span>
                    </li>
                  )
                }

                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onNavigate}
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
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  )
}

export default function Sidebar({ isMobileOpen, onClose }) {
  const { isComplete: setupComplete } = useAcademySetup()

  return (
    <>
      <aside className="hidden lg:flex w-72 min-h-screen bg-white border-r border-zinc-200 flex-col shrink-0">
        <SidebarContent setupComplete={setupComplete} />
      </aside>

      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          <aside className="relative w-72 max-w-[min(20rem,85vw)] h-full bg-white border-r border-zinc-200 flex flex-col shadow-xl">
            <SidebarContent
              showCloseButton
              onClose={onClose}
              onNavigate={onClose}
              setupComplete={setupComplete}
            />
          </aside>
        </div>
      )}
    </>
  )
}
