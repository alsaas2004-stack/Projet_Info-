import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiUsers, FiLoader, FiShield, FiUser, FiToggleLeft, FiTrash2, FiMail, FiPhone, FiChevronDown } from 'react-icons/fi'

const ROLES = [
  { value: 'etudiant',   label: 'Étudiant',        cls: 'bg-slate-100 text-slate-600'   },
  { value: 'admin',      label: 'Professeur/Admin', cls: 'bg-orange-100 text-orange-700' },
  { value: 'superadmin', label: 'Super Admin',      cls: 'bg-purple-100 text-purple-700' },
]

const ROLES_GERABLES = ROLES.filter(role => role.value !== 'superadmin')

function BadgeRole({ role }) {
  const cfg = ROLES.find(r => r.value === role) || ROLES[0]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>
      {role === 'superadmin' ? <FiShield size={11} /> : role === 'admin' ? <FiShield size={11} /> : <FiUser size={11} />}
      {cfg.label}
    </span>
  )
}

export default function Utilisateurs() {
  const { estSuperAdmin, profil } = useAuth()
  const [utilisateurs, setUtilisateurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreRole, setFiltreRole] = useState('')

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    const { data } = await supabase.from('utilisateur').select('*').order('nom')
    setUtilisateurs(data || [])
    setLoading(false)
  }

  async function changerActif(id, actuelActif) {
    if (id === profil.id_utilisateur) return
    const utilisateur = utilisateurs.find(u => u.id_utilisateur === id)
    if (utilisateur?.role === 'superadmin') return

    if (actuelActif) {
      const confirme = window.confirm(`Supprimer le compte de ${utilisateur?.nom || 'cet utilisateur'} de l'application ?`)
      if (!confirme) return
    }

    await supabase.from('utilisateur').update({ actif: !actuelActif }).eq('id_utilisateur', id)
    setUtilisateurs(prev => prev.map(u => u.id_utilisateur === id ? { ...u, actif: !actuelActif } : u))
  }

  async function changerRole(id, newRole) {
    if (id === profil.id_utilisateur) return
    const utilisateur = utilisateurs.find(u => u.id_utilisateur === id)
    if (utilisateur?.role === 'superadmin') return
    if (newRole === 'superadmin') return
    await supabase.from('utilisateur').update({ role: newRole }).eq('id_utilisateur', id)
    setUtilisateurs(prev => prev.map(u => u.id_utilisateur === id ? { ...u, role: newRole } : u))
  }

  if (!estSuperAdmin) return (
    <div className="p-4 sm:p-8">
      <p className="text-slate-500 text-sm">Accès réservé au super administrateur.</p>
    </div>
  )

  const filtres = filtreRole ? utilisateurs.filter(u => u.role === filtreRole) : utilisateurs
  const nbActifs = utilisateurs.filter(u => u.actif).length

  return (
    <div className="p-4 sm:p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 mb-8" />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-1">
            {utilisateurs.length} compte{utilisateurs.length > 1 ? 's' : ''} — {nbActifs} actif{nbActifs > 1 ? 's' : ''}
          </p>
        </div>
        <select
          value={filtreRole}
          onChange={e => setFiltreRole(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white cursor-pointer"
        >
          <option value="">Tous les rôles</option>
          <option value="superadmin">Super admins</option>
          <option value="admin">Admins</option>
          <option value="etudiant">Étudiants</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader size={28} className="animate-spin text-orange-400" />
          </div>
        ) : filtres.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FiUsers size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rôle</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtres.map(u => (
                <tr key={u.id_utilisateur} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        u.role === 'admin' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.nom.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                          {u.nom}
                          {u.id_utilisateur === profil.id_utilisateur && (
                            <span className="text-xs font-medium text-slate-400">(vous)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600 flex items-center gap-1.5">
                      <FiMail size={12} className="text-slate-400" />
                      {u.email}
                    </p>
                    {u.telephone && (
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <FiPhone size={11} />
                        {u.telephone}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {estSuperAdmin && u.id_utilisateur !== profil.id_utilisateur && u.role !== 'superadmin' ? (
                      <div className="relative inline-block">
                        <select
                          value={u.role}
                          onChange={e => changerRole(u.id_utilisateur, e.target.value)}
                          className="appearance-none pl-3 pr-7 py-1.5 rounded-full text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer bg-slate-100 text-slate-700"
                        >
                          {ROLES_GERABLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <FiChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <BadgeRole role={u.role} />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      u.actif ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.actif ? 'bg-green-500' : 'bg-slate-400'}`} />
                      {u.actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id_utilisateur !== profil.id_utilisateur && u.role !== 'superadmin' && (
                      <button
                        onClick={() => changerActif(u.id_utilisateur, u.actif)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          u.actif
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {u.actif
                          ? <><FiTrash2 size={15} /> Supprimer</>
                          : <><FiToggleLeft size={15} /> Activer</>
                        }
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  )
}
