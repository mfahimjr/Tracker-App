import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Assistant } from '../components/Assistant'
import { Button } from '../components/ui'
import { NAV, navFor } from '../config/navigation'
import { useMe } from '../store/useMe'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function AppShell() {
  const { logout } = useAuth()
  const me = useMe()
  const location = useLocation()

  const title = NAV.find((item) => item.path === location.pathname)?.label ?? 'Profile'

  return (
    <div className="min-h-screen">
      <nav className="fixed inset-y-0 left-0 hidden w-60 overflow-auto bg-nav px-3.5 py-5 md:block">
        <div className="mb-8 flex items-center gap-2.5 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-indigo-400 to-violet-600 text-sm font-bold text-white shadow-pop">
            T
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">Tracker</span>
        </div>
        <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-navt/70 uppercase">Menu</p>
        {navFor(me.role).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'bg-linear-to-r from-indigo-500/25 to-transparent font-medium text-white shadow-[inset_3px_0_0_var(--ac)]'
                  : 'text-navt hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="p-4 md:ml-60 md:p-8">
        <header className="sticky top-0 z-10 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-bd bg-bg/80 px-4 py-3.5 backdrop-blur md:-mx-8 md:px-8">
          <div>
            <p className="text-xs font-medium text-mu">Tracker</p>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/profile" className="flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 hover:bg-acs">
              <span className="grid size-8 place-items-center rounded-full bg-acs text-xs font-semibold text-ac">
                {initials(me.name)}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm leading-tight font-medium">{me.name}</span>
                <span className="block text-xs leading-tight text-mu">{me.role}</span>
              </span>
            </NavLink>
            <Button onClick={() => void logout()}>Log out</Button>
          </div>
        </header>
        <Outlet />
      </main>

      <Assistant />
    </div>
  )
}
