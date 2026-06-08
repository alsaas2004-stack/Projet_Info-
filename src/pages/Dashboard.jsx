import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiBox, FiClipboard, FiAlertTriangle, FiLoader, FiArrowRight, FiPackage } from 'react-icons/fi'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow p-5 flex items-center gap-4 hover:shadow-md transition-all ${to ? 'cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function BadgeStatut({ statut }) {
  const cfg = {
    en_attente: { cls: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
    en_cours:   { cls: 'bg-orange-100 text-orange-700', label: 'En cours'   },
  }
  const { cls, label } = cfg[statut] || { cls: 'bg-slate-100 text-slate-500', label: statut }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
}

const COULEURS_ETAT = {
  disponible:   '#22c55e',
  emprunte:     '#f97316',
  indisponible: '#ef4444',
}

export default function Dashboard() {
  const { profil, estAdmin } = useAuth()
  const [stats, setStats] = useState({ disponible: 0, emprunte: 0, indisponible: 0, total: 0, enCours: 0 })
  const [empruntsEnCours, setEmpruntsEnCours] = useState([])
  const [demandesEnAttente, setDemandesEnAttente] = useState([])
  const [retards, setRetards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [estAdmin])

  async function charger() {
    setLoading(true)

    const queries = [
      supabase.from('materiel').select('etat').eq('actif', true),
      supabase.from('emprunt')
        .select('*, materiel(nom, id_materiel), utilisateur!emprunt_id_utilisateur_fkey(nom)')
        .eq('statut', 'en_cours')
        .order('date_retour_prevue', { ascending: true })
        .limit(5),
      supabase.from('emprunt').select('*', { count: 'exact', head: true }).eq('statut', 'en_cours'),
    ]

    if (estAdmin) {
      queries.push(
        supabase.from('emprunt')
          .select('*, materiel(nom, id_materiel), utilisateur!emprunt_id_utilisateur_fkey(nom, email)')
          .eq('statut', 'en_attente')
          .order('date_emprunt', { ascending: true })
          .limit(10)
      )
    }

    const results = await Promise.all(queries)
    const [mats, cours, coursCount, attente] = results

    // Calcul stats matériels
    const materiels = mats.data || []
    const s = { disponible: 0, emprunte: 0, indisponible: 0 }
    materiels.forEach(m => { if (s[m.etat] !== undefined) s[m.etat]++ })
    setStats({ ...s, total: materiels.length, enCours: coursCount.count || 0 })

    // Emprunts en cours
    const coursData = cours.data || []
    setEmpruntsEnCours(coursData)

    // Retards
    const today = new Date()
    setRetards(coursData.filter(e => e.date_retour_prevue && new Date(e.date_retour_prevue) < today))

    // Demandes en attente (admin)
    if (estAdmin && attente) setDemandesEnAttente(attente.data || [])

    setLoading(false)
  }

  const pieData = [
    { name: 'Disponible', value: stats.disponible,   color: COULEURS_ETAT.disponible   },
    { name: 'Emprunté',   value: stats.emprunte,     color: COULEURS_ETAT.emprunte     },
    { name: 'Indisponible',value: stats.indisponible, color: COULEURS_ETAT.indisponible },
  ].filter(d => d.value > 0)

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <FiLoader size={32} className="animate-spin text-orange-400" />
    </div>
  )

  return (
    <div className="p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-8 -mt-8 mb-8" />

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Bonjour, {profil?.nom} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Alertes retards */}
      {retards.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <FiAlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-700">
              {retards.length} emprunt{retards.length > 1 ? 's' : ''} en retard
            </p>
            <p className="text-xs text-red-600 mt-0.5">
              {retards.map(r => r.materiel?.nom).join(', ')}
            </p>
          </div>
          <Link to="/emprunts" className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 flex-shrink-0">
            Voir <FiArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Cartes stats */}
      {estAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard icon={FiPackage}      label="Total"         value={stats.total}               color="bg-slate-600"  to="/materiels" />
          <StatCard icon={FiBox}          label="Disponibles"   value={stats.disponible}           color="bg-green-500"  to="/materiels?etat=disponible" />
          <StatCard icon={FiClipboard}    label="En cours"      value={stats.enCours}              color="bg-orange-500" to="/emprunts?statut=en_cours" />
          <StatCard icon={FiAlertTriangle}label="En attente"    value={demandesEnAttente.length}   color="bg-yellow-500" to="/emprunts?statut=en_attente" />
          <StatCard icon={FiAlertTriangle}label="Indisponibles" value={stats.indisponible}         color="bg-red-500"    to="/materiels?etat=indisponible" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon={FiPackage}   label="Total matériels"   value={stats.total}      color="bg-slate-600"  to="/materiels" />
          <StatCard icon={FiBox}       label="Disponibles"       value={stats.disponible} color="bg-green-500"  to="/materiels?etat=disponible" />
          <StatCard icon={FiClipboard} label="En cours d'emprunt" value={stats.enCours}   color="bg-orange-500" to="/emprunts?statut=en_cours" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Graphique répartition */}
        {stats.total > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow p-6">
            <h2 className="text-sm font-bold text-slate-700 mb-4">Répartition des matériels</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} matériel${value > 1 ? 's' : ''}`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Emprunts en cours */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700">Emprunts en cours</h2>
            <Link to="/emprunts" className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
              Voir tout <FiArrowRight size={11} />
            </Link>
          </div>
          {empruntsEnCours.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FiClipboard size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">Aucun emprunt en cours</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {empruntsEnCours.map(e => {
                const enRetard = e.date_retour_prevue && new Date(e.date_retour_prevue) < new Date()
                return (
                  <div key={e.id_emprunt} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link to={`/materiels/${e.id_materiel}`} className="text-sm font-medium text-slate-800 hover:text-orange-500 transition truncate block">
                        {e.materiel?.nom}
                      </Link>
                      {estAdmin && (
                        <p className="text-xs text-slate-400 mt-0.5">{e.utilisateur?.nom}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-3 text-right">
                      {e.date_retour_prevue ? (
                        <p className={`text-xs font-medium ${enRetard ? 'text-red-600' : 'text-slate-400'}`}>
                          {enRetard && '⚠ '}
                          {new Date(e.date_retour_prevue).toLocaleDateString('fr-FR')}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Demandes en attente (admin) */}
        {estAdmin && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-700">
                Demandes en attente
                {demandesEnAttente.length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {demandesEnAttente.length}
                  </span>
                )}
              </h2>
              <Link to="/emprunts" className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1">
                Gérer <FiArrowRight size={11} />
              </Link>
            </div>
            {demandesEnAttente.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="text-xs">Aucune demande en attente</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demandesEnAttente.map(e => (
                  <div key={e.id_emprunt} className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{e.materiel?.nom}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{e.utilisateur?.nom}</p>
                    </div>
                    <BadgeStatut statut={e.statut} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
