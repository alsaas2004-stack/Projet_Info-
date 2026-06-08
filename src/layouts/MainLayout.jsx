import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  FiHome, FiBox, FiTag, FiClipboard,
  FiClock, FiBell, FiUsers, FiLogOut, FiPackage, FiMenu, FiX
} from 'react-icons/fi'

// Petits arcs décoratifs pour le header sidebar
function SidebarArcs() {
  return (
    <svg className="absolute top-0 right-0 opacity-20 pointer-events-none" width="80" height="80" viewBox="0 0 80 80">
      <path d="M 80 64 A 64 64 0 0 1 16 0" fill="none" stroke="white" strokeWidth="10"/>
      <path d="M 80 44 A 44 44 0 0 1 36 0" fill="none" stroke="white" strokeWidth="10"/>
      <path d="M 80 24 A 24 24 0 0 1 56 0" fill="none" stroke="white" strokeWidth="10"/>
    </svg>
  )
}

function getRoleLabel(role) {
  if (role === 'superadmin') return 'Super Admin'
  if (role === 'admin') return 'Professeur / Admin'
  return 'Étudiant'
}

function getRoleBadge(role) {
  if (role === 'superadmin') return { label: 'SUP', cls: 'bg-purple-500/20 text-purple-300' }
  if (role === 'admin')      return { label: 'ADM', cls: 'bg-orange-500/20 text-orange-400' }
  return                            { label: 'ETU', cls: 'bg-slate-700 text-slate-400' }
}

export default function MainLayout() {
  const { profil, profilErreur, estAdmin, estSuperAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [nbNotifs, setNbNotifs] = useState(0)
  const [menuOuvert, setMenuOuvert] = useState(false)

  useEffect(() => {
    if (!profil?.id_utilisateur) return
    chargerNotifs()
    const interval = setInterval(chargerNotifs, 30000)
    window.addEventListener('notifications-updated', chargerNotifs)
    return () => {
      clearInterval(interval)
      window.removeEventListener('notifications-updated', chargerNotifs)
    }
  }, [profil?.id_utilisateur])

  async function chargerNotifs() {
    const { count } = await supabase
      .from('notification')
      .select('*', { count: 'exact', head: true })
      .eq('id_utilisateur', profil.id_utilisateur)
      .eq('lu', false)
    setNbNotifs(count || 0)
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const navCommun = [
    { to: '/',              icon: FiHome,      label: 'Tableau de bord' },
    { to: '/materiels',     icon: FiBox,       label: 'Matériels'       },
    { to: '/emprunts',      icon: FiClipboard, label: 'Mes emprunts'    },
    { to: '/historique',    icon: FiClock,     label: 'Historique'      },
    { to: '/notifications', icon: FiBell,      label: 'Notifications', badge: nbNotifs },
  ]

  function fermerMenu() {
    setMenuOuvert(false)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── Barre mobile (hamburger) ── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-30 bg-slate-900 flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FiPackage size={16} className="text-white" />
          </div>
          <span className="text-white font-extrabold text-base tracking-tight">IcamTrack</span>
        </div>
        <button
          onClick={() => setMenuOuvert(o => !o)}
          className="p-2 rounded-xl text-white hover:bg-slate-800 transition cursor-pointer relative"
        >
          {menuOuvert ? <FiX size={22} /> : <FiMenu size={22} />}
          {!menuOuvert && nbNotifs > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-4 h-4 rounded-full flex items-center justify-center px-1 leading-none">
              {nbNotifs > 9 ? '9+' : nbNotifs}
            </span>
          )}
        </button>
      </div>

      {/* ── Overlay mobile ── */}
      {menuOuvert && (
        <div
          onClick={fermerMenu}
          className="lg:hidden fixed inset-0 bg-black/50 z-20"
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`w-64 bg-slate-900 flex flex-col fixed h-full z-30 shadow-2xl transition-transform duration-200 ${
        menuOuvert ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>

        {/* Logo ICAM avec motif arcs */}
        <div className="relative overflow-hidden bg-orange-500 px-5 py-4">
          <SidebarArcs />
          <div className="relative flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <FiPackage size={18} className="text-white" />
            </div>
            <div>
              <div className="text-white font-extrabold text-lg leading-none tracking-tight">
                IcamTrack
              </div>
              <div className="text-orange-100 text-xs mt-0.5 font-medium">
                Gestion du matériel
              </div>
            </div>
            <button
              onClick={fermerMenu}
              className="lg:hidden ml-auto p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Séparateur avec dégradé ICAM */}
        <div className="h-px bg-gradient-to-r from-orange-700 via-orange-500 to-slate-700" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

          {navCommun.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={fermerMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold min-w-5 h-5 rounded-full flex items-center justify-center px-1 leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </NavLink>
          ))}

          {estAdmin && (
            <>
              <div className="pt-4 pb-1 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-slate-700" />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {estSuperAdmin ? 'Super Admin' : 'Admin'}
                  </p>
                  <div className="flex-1 h-px bg-slate-700" />
                </div>
              </div>
              {/* Catégories : visible par tous les admins */}
              <NavLink
                to="/categories"
                onClick={fermerMenu}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <FiTag size={17} />
                Catégories
              </NavLink>
              {/* Utilisateurs : visible uniquement par le superadmin */}
              {estSuperAdmin && (
                <NavLink
                  to="/utilisateurs"
                  onClick={fermerMenu}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <FiUsers size={17} />
                  Utilisateurs
                </NavLink>
              )}
            </>
          )}
        </nav>

        {/* Profil + déconnexion */}
        <div className="border-t border-slate-800 p-3">
          {/* Info utilisateur */}
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${
              profil?.role === 'superadmin' ? 'bg-purple-600' : 'bg-orange-500'
            }`}>
              {profil?.nom?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-none">
                {profil?.nom || 'Utilisateur'}
              </p>
              <p className="text-slate-500 text-xs truncate mt-0.5">
                {getRoleLabel(profil?.role)}
              </p>
            </div>
            {(() => {
              const { label, cls } = getRoleBadge(profil?.role)
              return (
                <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-md font-semibold ${cls}`}>
                  {label}
                </span>
              )
            })()}
          </div>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all duration-150 cursor-pointer"
          >
            <FiLogOut size={17} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0 w-full min-w-0">
        {/* Barre orange en haut du contenu - signature ICAM */}
        <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 sticky top-0 z-10" />
        {profilErreur ? (
          <div className="p-8">
            <div className="bg-white rounded-2xl shadow border border-red-100 overflow-hidden max-w-2xl">
              <div className="h-1 bg-gradient-to-r from-red-300 via-red-500 to-red-700" />
              <div className="p-6">
                <h1 className="text-xl font-extrabold text-slate-900">Profil IcamTrack introuvable</h1>
                <p className="text-sm text-slate-500 mt-2">{profilErreur}</p>
                <p className="text-sm text-slate-500 mt-3">
                  Crée une ligne dans la table <span className="font-semibold text-slate-700">utilisateur</span> avec exactement le même email que ton compte Supabase Auth.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  )
}
