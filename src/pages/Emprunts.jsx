import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiClipboard, FiLoader, FiCheck, FiX, FiRotateCcw, FiAlertTriangle, FiArrowLeft, FiCalendar } from 'react-icons/fi'

function BadgeStatut({ statut }) {
  const cfg = {
    en_attente: { cls: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
    accepte:    { cls: 'bg-blue-100 text-blue-700',     label: 'Accepté'    },
    refuse:     { cls: 'bg-red-100 text-red-700',       label: 'Refusé'     },
    en_cours:   { cls: 'bg-orange-100 text-orange-700', label: 'En cours'   },
    rendu:      { cls: 'bg-slate-100 text-slate-600',   label: 'Rendu'      },
  }
  const { cls, label } = cfg[statut] || { cls: 'bg-slate-100 text-slate-500', label: statut }
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
}

export default function Emprunts() {
  const { profil, estAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [emprunts, setEmprunts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState(searchParams.get('statut') || '')
  const [filtreDateDu, setFiltreDateDu] = useState('')
  const [filtreDateAu, setFiltreDateAu] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  // Modal refus
  const [showRefus, setShowRefus] = useState(false)
  const [empruntARefuser, setEmpruntARefuser] = useState(null)
  const [motifRefus, setMotifRefus] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (profil?.id_utilisateur) {
      charger()
    } else {
      setEmprunts([])
      setLoading(false)
    }
  }, [authLoading, profil?.id_utilisateur, estAdmin])

  async function charger() {
    if (!profil?.id_utilisateur) return
    setLoading(true)
    try {
      let query = supabase
        .from('emprunt')
        .select('*, materiel(nom, id_materiel), utilisateur!emprunt_id_utilisateur_fkey(nom, email)')
        .order('date_emprunt', { ascending: false })

      if (!estAdmin) query = query.eq('id_utilisateur', profil.id_utilisateur)

      const { data } = await query
      setEmprunts(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function accepter(emp) {
    setActionLoading(emp.id_emprunt)
    // Le trigger DB met à jour materiel.etat et materiel.stock automatiquement
    await Promise.all([
      supabase.from('emprunt').update({
        statut: 'en_cours',
        valide_par: profil.id_utilisateur,
        date_validation: new Date().toISOString(),
      }).eq('id_emprunt', emp.id_emprunt),
      supabase.from('historique').insert({
        type_action: 'emprunt',
        commentaire: `Emprunt accepté : ${emp.materiel?.nom} → ${emp.utilisateur?.nom}`,
        id_materiel: emp.id_materiel,
        id_utilisateur: emp.id_utilisateur,
      }),
      supabase.from('notification').insert({
        type_notif: 'accepte',
        message: `Votre demande d'emprunt pour "${emp.materiel?.nom}" a été acceptée.`,
        id_utilisateur: emp.id_utilisateur,
        id_emprunt: emp.id_emprunt,
      }),
    ])
    setActionLoading(null)
    charger()
  }

  async function refuser() {
    if (!empruntARefuser) return
    setActionLoading(empruntARefuser.id_emprunt)
    // Le trigger DB restore materiel.etat = 'disponible' automatiquement
    await Promise.all([
      supabase.from('emprunt').update({
        statut: 'refuse',
        motif_refus: motifRefus.trim() || null,
        valide_par: profil.id_utilisateur,
        date_validation: new Date().toISOString(),
      }).eq('id_emprunt', empruntARefuser.id_emprunt),
      supabase.from('historique').insert({
        type_action: 'refus',
        commentaire: `Emprunt refusé : ${empruntARefuser.materiel?.nom}${motifRefus ? ` — ${motifRefus}` : ''}`,
        id_materiel: empruntARefuser.id_materiel,
        id_utilisateur: empruntARefuser.id_utilisateur,
      }),
      supabase.from('notification').insert({
        type_notif: 'refuse',
        message: `Votre demande pour "${empruntARefuser.materiel?.nom}" a été refusée.${motifRefus ? ` Motif : ${motifRefus}` : ''}`,
        id_utilisateur: empruntARefuser.id_utilisateur,
        id_emprunt: empruntARefuser.id_emprunt,
      }),
    ])
    setActionLoading(null)
    setShowRefus(false)
    setMotifRefus('')
    setEmpruntARefuser(null)
    charger()
  }

  async function enregistrerRetour(emp) {
    setActionLoading(emp.id_emprunt)
    // Le trigger DB restaure materiel.etat et materiel.stock automatiquement
    await Promise.all([
      supabase.from('emprunt').update({
        statut: 'rendu',
        date_retour_reelle: new Date().toISOString(),
      }).eq('id_emprunt', emp.id_emprunt),
      supabase.from('historique').insert({
        type_action: 'retour',
        commentaire: `Retour de ${emp.materiel?.nom} par ${emp.utilisateur?.nom}`,
        id_materiel: emp.id_materiel,
        id_utilisateur: emp.id_utilisateur,
      }),
    ])
    setActionLoading(null)
    charger()
  }

  const filtres = emprunts.filter(e => {
    if (filtreStatut && e.statut !== filtreStatut) return false
    if (filtreDateDu && new Date(e.date_emprunt) < new Date(filtreDateDu)) return false
    if (filtreDateAu && new Date(e.date_emprunt) > new Date(filtreDateAu + 'T23:59:59')) return false
    return true
  })
  const nbAttente = emprunts.filter(e => e.statut === 'en_attente').length

  return (
    <div className="p-4 sm:p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 mb-8" />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-5 transition cursor-pointer"
      >
        <FiArrowLeft size={15} /> Retour
      </button>

      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">
            {estAdmin ? 'Gestion des emprunts' : 'Mes emprunts'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtres.length} emprunt{filtres.length > 1 ? 's' : ''}
            {estAdmin && nbAttente > 0 && (
              <span className="ml-2 text-orange-600 font-semibold">
                · {nbAttente} en attente
              </span>
            )}
          </p>
        </div>

        {/* Barre de filtres unifiée */}
        <div className="flex flex-wrap gap-2">
          <select
            value={filtreStatut}
            onChange={e => setFiltreStatut(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="rendu">Rendu</option>
            <option value="refuse">Refusé</option>
            <option value="accepte">Accepté</option>
          </select>

          {estAdmin && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <FiCalendar size={13} className="text-slate-400 flex-shrink-0" />
                <input
                  type="date"
                  value={filtreDateDu}
                  onChange={e => setFiltreDateDu(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400">→</span>
                <input
                  type="date"
                  value={filtreDateAu}
                  onChange={e => setFiltreDateAu(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                />
              </div>
              {(filtreDateDu || filtreDateAu || filtreStatut) && (
                <button
                  onClick={() => { setFiltreDateDu(''); setFiltreDateAu(''); setFiltreStatut('') }}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition cursor-pointer"
                >
                  Effacer tout
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader size={28} className="animate-spin text-orange-400" />
          </div>
        ) : filtres.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FiClipboard size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun emprunt</p>
            {!estAdmin && (
              <Link to="/materiels" className="mt-3 inline-block text-sm text-orange-500 font-semibold hover:text-orange-600">
                Voir les matériels disponibles →
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* ── Cartes mobile ── */}
            <div className="sm:hidden divide-y divide-slate-50">
              {filtres.map(e => {
                const enRetard = e.statut === 'en_cours' && e.date_retour_prevue && new Date(e.date_retour_prevue) < new Date()
                return (
                  <div key={e.id_emprunt} className={`p-4 ${enRetard ? 'bg-red-50/40' : ''}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <Link to={`/materiels/${e.id_materiel}`} className="text-sm font-semibold text-slate-800 hover:text-orange-500 transition block truncate">
                          {e.materiel?.nom}
                        </Link>
                        {estAdmin && <p className="text-xs text-slate-500 mt-0.5">{e.utilisateur?.nom}</p>}
                        {enRetard && (
                          <p className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-0.5">
                            <FiAlertTriangle size={11} /> En retard
                          </p>
                        )}
                      </div>
                      <BadgeStatut statut={e.statut} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      {(e.quantite || 1) > 1 && <span>Qté : {e.quantite}</span>}
                      <span>{new Date(e.date_emprunt).toLocaleDateString('fr-FR')}</span>
                      {e.date_retour_prevue && (
                        <span className={enRetard ? 'text-red-500 font-semibold' : ''}>
                          → {new Date(e.date_retour_prevue).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>
                    {e.motif_refus && (
                      <p className="text-xs text-slate-400 mb-2 italic">{e.motif_refus}</p>
                    )}
                    {estAdmin && (
                      <div className="flex gap-2 flex-wrap">
                        {e.statut === 'en_attente' && (
                          <>
                            <button onClick={() => accepter(e)} disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition cursor-pointer disabled:opacity-50">
                              {actionLoading === e.id_emprunt ? <FiLoader size={12} className="animate-spin" /> : <FiCheck size={12} />}
                              Accepter
                            </button>
                            <button onClick={() => { setEmpruntARefuser(e); setShowRefus(true) }} disabled={!!actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer disabled:opacity-50">
                              <FiX size={12} /> Refuser
                            </button>
                          </>
                        )}
                        {e.statut === 'en_cours' && (
                          <button onClick={() => enregistrerRetour(e)} disabled={!!actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50">
                            {actionLoading === e.id_emprunt ? <FiLoader size={12} className="animate-spin" /> : <FiRotateCcw size={12} />}
                            Retour enregistré
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Tableau desktop ── */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Matériel</th>
                    {estAdmin && <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Étudiant</th>}
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qté</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Demande</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Retour prévu</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                    {estAdmin && <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtres.map(e => {
                    const enRetard = e.statut === 'en_cours' && e.date_retour_prevue && new Date(e.date_retour_prevue) < new Date()
                    return (
                      <tr key={e.id_emprunt} className={`hover:bg-slate-50/50 transition-colors ${enRetard ? 'bg-red-50/40' : ''}`}>
                        <td className="px-6 py-4">
                          <Link to={`/materiels/${e.id_materiel}`} className="text-sm font-semibold text-slate-800 hover:text-orange-500 transition">
                            {e.materiel?.nom}
                          </Link>
                          {enRetard && (
                            <p className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-0.5">
                              <FiAlertTriangle size={11} /> En retard
                            </p>
                          )}
                        </td>
                        {estAdmin && (
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700 font-medium">{e.utilisateur?.nom}</p>
                            <p className="text-xs text-slate-400">{e.utilisateur?.email}</p>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-700">{e.quantite || 1}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(e.date_emprunt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {e.date_retour_prevue
                            ? new Date(e.date_retour_prevue).toLocaleDateString('fr-FR')
                            : <span className="text-slate-300">—</span>
                          }
                        </td>
                        <td className="px-6 py-4">
                          <BadgeStatut statut={e.statut} />
                          {e.motif_refus && (
                            <p className="text-xs text-slate-400 mt-1 max-w-40 truncate" title={e.motif_refus}>
                              {e.motif_refus}
                            </p>
                          )}
                        </td>
                        {estAdmin && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-end">
                              {e.statut === 'en_attente' && (
                                <>
                                  <button onClick={() => accepter(e)} disabled={!!actionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition cursor-pointer disabled:opacity-50">
                                    {actionLoading === e.id_emprunt ? <FiLoader size={12} className="animate-spin" /> : <FiCheck size={12} />}
                                    Accepter
                                  </button>
                                  <button onClick={() => { setEmpruntARefuser(e); setShowRefus(true) }} disabled={!!actionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition cursor-pointer disabled:opacity-50">
                                    <FiX size={12} /> Refuser
                                  </button>
                                </>
                              )}
                              {e.statut === 'en_cours' && (
                                <button onClick={() => enregistrerRetour(e)} disabled={!!actionLoading}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50">
                                  {actionLoading === e.id_emprunt ? <FiLoader size={12} className="animate-spin" /> : <FiRotateCcw size={12} />}
                                  Retour enregistré
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Modal refus ── */}
      {showRefus && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-red-300 via-red-500 to-red-600" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">Refuser la demande</h2>
                <button onClick={() => setShowRefus(false)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer">
                  <FiX size={18} />
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5">
                <p className="text-sm font-semibold text-slate-800">{empruntARefuser?.materiel?.nom}</p>
                <p className="text-xs text-slate-400 mt-0.5">Demandé par {empruntARefuser?.utilisateur?.nom}</p>
              </div>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Motif du refus
                  <span className="text-slate-400 font-normal ml-1">(optionnel)</span>
                </label>
                <textarea
                  value={motifRefus}
                  onChange={e => setMotifRefus(e.target.value)}
                  rows={3}
                  placeholder="Expliquer la raison du refus…"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent text-sm bg-slate-50 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRefus(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={refuser}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition cursor-pointer"
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
