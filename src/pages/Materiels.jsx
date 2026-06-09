import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiBox, FiPlus, FiSearch, FiEdit2, FiXCircle, FiLoader } from 'react-icons/fi'

function BadgeEtat({ etat }) {
  const cfg = {
    disponible:   { cls: 'bg-green-100 text-green-700',   label: 'Disponible'   },
    emprunte:     { cls: 'bg-orange-100 text-orange-700', label: 'Emprunté'     },
    indisponible: { cls: 'bg-red-100 text-red-700',       label: 'Indisponible' },
    en_attente:   { cls: 'bg-yellow-100 text-yellow-700', label: 'En attente'   },
  }
  const { cls, label } = cfg[etat] || { cls: 'bg-slate-100 text-slate-500', label: etat }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

export default function Materiels() {
  const { estAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const [materiels, setMateriels] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreCategorie, setFiltreCategorie] = useState('')
  const [filtreEtat, setFiltreEtat] = useState(searchParams.get('etat') || '')

  useEffect(() => {
    charger()
    chargerCategories()
  }, [estAdmin])

  async function charger() {
    setLoading(true)
    let query = supabase
      .from('materiel')
      .select('*, categorie(nom_categorie)')
      .eq('actif', true)
      .order('nom')

    if (!estAdmin) query = query.eq('etat', 'disponible')

    const { data } = await query
    setMateriels(data || [])
    setLoading(false)
  }

  async function chargerCategories() {
    const { data } = await supabase.from('categorie').select('*').order('nom_categorie')
    setCategories(data || [])
  }

  async function desactiver(e, id) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Désactiver ce matériel ?')) return
    await supabase.from('materiel').update({ actif: false }).eq('id_materiel', id)
    charger()
  }

  const filtres = materiels.filter(m => {
    const q = recherche.toLowerCase()
    const matchR = m.nom.toLowerCase().includes(q) || (m.reference || '').toLowerCase().includes(q)
    const matchC = !filtreCategorie || m.id_categorie === filtreCategorie
    const matchE = !filtreEtat || m.etat === filtreEtat
    return matchR && matchC && matchE
  })

  return (
    <div className="p-4 sm:p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 mb-8" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Matériels</h1>
          <p className="text-slate-500 text-sm mt-1">
            {estAdmin
              ? `${materiels.length} matériel${materiels.length > 1 ? 's' : ''} au catalogue`
              : 'Matériels disponibles à l\'emprunt'}
          </p>
        </div>
        {estAdmin && (
          <Link
            to="/materiels/nouveau"
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-100 flex-shrink-0"
          >
            <FiPlus size={16} />
            Nouveau matériel
          </Link>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-56">
          <FiSearch size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher par nom ou référence…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-white"
          />
        </div>
        <select
          value={filtreCategorie}
          onChange={e => setFiltreCategorie(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white cursor-pointer"
        >
          <option value="">Toutes les catégories</option>
          {categories.map(c => (
            <option key={c.id_categorie} value={c.id_categorie}>{c.nom_categorie}</option>
          ))}
        </select>
        {estAdmin && (
          <select
            value={filtreEtat}
            onChange={e => setFiltreEtat(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white cursor-pointer"
          >
            <option value="">Tous les états</option>
            <option value="disponible">Disponible</option>
            <option value="emprunte">Emprunté</option>
            <option value="indisponible">Indisponible</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <FiLoader size={32} className="animate-spin text-orange-400" />
        </div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <FiBox size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Aucun matériel trouvé</p>
          {estAdmin && (
            <Link to="/materiels/nouveau" className="mt-3 inline-block text-sm text-orange-500 font-semibold hover:text-orange-600">
              Ajouter le premier matériel →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtres.map(m => (
            <div key={m.id_materiel} className="bg-white rounded-2xl border border-slate-100 shadow hover:shadow-md transition-all flex flex-col">
              {/* Image */}
              <div className="relative h-40 rounded-t-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                {m.image_url ? (
                  <img src={m.image_url} alt={m.nom} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FiBox size={36} className="text-slate-300" />
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                  <BadgeEtat etat={m.etat} />
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1">
                <p className="font-semibold text-slate-800 text-sm leading-snug">{m.nom}</p>
                {m.reference && <p className="text-xs text-slate-400 mt-0.5">Réf. {m.reference}</p>}
                {m.categorie && (
                  <span className="text-xs text-orange-600 font-medium mt-2 bg-orange-50 inline-block px-2 py-0.5 rounded-full self-start">
                    {m.categorie.nom_categorie}
                  </span>
                )}
                {estAdmin && (
                  <span className={`text-xs font-semibold mt-1 self-start ${
                    (m.stock ?? 1) === 0 ? 'text-red-500' : (m.stock ?? 1) <= 3 ? 'text-orange-500' : 'text-slate-400'
                  }`}>
                    Stock : {m.stock ?? 1}
                  </span>
                )}

                <div className="flex gap-2 mt-auto pt-3">
                  <Link
                    to={`/materiels/${m.id_materiel}`}
                    className="flex-1 text-center bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-slate-600 font-semibold text-xs py-2 rounded-xl transition border border-slate-100"
                  >
                    Voir détail
                  </Link>
                  {estAdmin && (
                    <>
                      <Link
                        to={`/materiels/${m.id_materiel}/modifier`}
                        className="p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition border border-slate-100"
                        title="Modifier"
                      >
                        <FiEdit2 size={14} />
                      </Link>
                      <button
                        onClick={ev => desactiver(ev, m.id_materiel)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition border border-slate-100 cursor-pointer"
                        title="Retirer du catalogue"
                      >
                        <FiXCircle size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
