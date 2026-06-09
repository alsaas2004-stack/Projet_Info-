import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiClock, FiLoader, FiUser, FiBox, FiCalendar } from 'react-icons/fi'

const LABELS_ACTION = {
  creation:         'Création',
  emprunt:          'Emprunt',
  retour:           'Retour',
  mise_indisponible:'Mis indisponible',
  remise_dispo:     'Remis disponible',
  refus:            'Refus',
}

const STYLES_ACTION = {
  creation:         'bg-blue-100 text-blue-700',
  emprunt:          'bg-orange-100 text-orange-700',
  retour:           'bg-green-100 text-green-700',
  mise_indisponible:'bg-red-100 text-red-700',
  remise_dispo:     'bg-green-100 text-green-700',
  refus:            'bg-red-100 text-red-700',
}

export default function Historique() {
  const { profil, estAdmin, loading: authLoading } = useAuth()
  const [historique, setHistorique] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreAction, setFiltreAction] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreDateDu, setFiltreDateDu] = useState('')
  const [filtreDateAu, setFiltreDateAu] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (profil?.id_utilisateur) {
      charger()
    } else {
      setHistorique([])
      setLoading(false)
    }
  }, [authLoading, profil?.id_utilisateur, estAdmin])

  async function charger() {
    if (!profil?.id_utilisateur) return
    setLoading(true)
    try {
      let query = supabase
        .from('historique')
        .select('*, materiel(nom), utilisateur(nom)')
        .order('date_action', { ascending: false })
        .limit(200)

      if (!estAdmin) query = query.eq('id_utilisateur', profil.id_utilisateur)

      const { data } = await query
      setHistorique(data || [])
    } finally {
      setLoading(false)
    }
  }

  const filtres = historique.filter(h => {
    const matchAction = !filtreAction || h.type_action === filtreAction
    const matchRecherche = !recherche ||
      (h.materiel?.nom || '').toLowerCase().includes(recherche.toLowerCase()) ||
      (h.utilisateur?.nom || '').toLowerCase().includes(recherche.toLowerCase()) ||
      (h.commentaire || '').toLowerCase().includes(recherche.toLowerCase())
    const date = new Date(h.date_action)
    const matchDu = !filtreDateDu || date >= new Date(filtreDateDu)
    const matchAu = !filtreDateAu || date <= new Date(filtreDateAu + 'T23:59:59')
    return matchAction && matchRecherche && matchDu && matchAu
  })

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 mb-8" />

      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Historique</h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtres.length} action{filtres.length > 1 ? 's' : ''}
            {!estAdmin && ' · votre historique personnel'}
          </p>
        </div>

        {/* Barre de filtres unifiée */}
        <div className="flex flex-wrap gap-2">
          {estAdmin && (
            <input
              type="text"
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher…"
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white min-w-36"
            />
          )}
          <select
            value={filtreAction}
            onChange={e => setFiltreAction(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white cursor-pointer"
          >
            <option value="">Toutes les actions</option>
            <option value="creation">Création</option>
            <option value="emprunt">Emprunt</option>
            <option value="retour">Retour</option>
            <option value="refus">Refus</option>
            <option value="mise_indisponible">Mise indisponible</option>
            <option value="remise_dispo">Remise disponible</option>
          </select>
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
          {(filtreDateDu || filtreDateAu || filtreAction || recherche) && (
            <button
              onClick={() => { setFiltreDateDu(''); setFiltreDateAu(''); setFiltreAction(''); setRecherche('') }}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 transition cursor-pointer"
            >
              Effacer tout
            </button>
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
            <FiClock size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun historique</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtres.map(h => (
              <div key={h.id_historique} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                {/* Icône */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5">
                  <FiClock size={14} className="text-slate-500" />
                </div>

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STYLES_ACTION[h.type_action] || 'bg-slate-100 text-slate-600'}`}>
                      {LABELS_ACTION[h.type_action] || h.type_action}
                    </span>
                    {h.materiel && (
                      <span className="flex items-center gap-1 text-sm font-medium text-slate-800">
                        <FiBox size={12} className="text-slate-400" />
                        {h.materiel.nom}
                      </span>
                    )}
                  </div>
                  {h.commentaire && (
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{h.commentaire}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {estAdmin && h.utilisateur && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <FiUser size={11} />
                        {h.utilisateur.nom}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{formatDate(h.date_action)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
