import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiTag, FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiLoader } from 'react-icons/fi'

export default function Categories() {
  const { estAdmin } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nouveau, setNouveau] = useState('')
  const [ajoutLoading, setAjoutLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editNom, setEditNom] = useState('')

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)
    const { data } = await supabase.from('categorie').select('*').order('nom_categorie')
    setCategories(data || [])
    setLoading(false)
  }

  async function ajouter(e) {
    e.preventDefault()
    if (!nouveau.trim()) return
    setAjoutLoading(true)
    await supabase.from('categorie').insert({ nom_categorie: nouveau.trim() })
    setNouveau('')
    setShowForm(false)
    setAjoutLoading(false)
    charger()
  }

  function commencerEdit(cat) {
    setEditId(cat.id_categorie)
    setEditNom(cat.nom_categorie)
  }

  async function sauvegarderEdit(id) {
    if (!editNom.trim()) return
    await supabase.from('categorie').update({ nom_categorie: editNom.trim() }).eq('id_categorie', id)
    setEditId(null)
    charger()
  }

  async function supprimer(id) {
    if (!confirm('Supprimer cette catégorie ? Les matériels associés ne seront pas supprimés.')) return
    await supabase.from('categorie').delete().eq('id_categorie', id)
    charger()
  }

  if (!estAdmin) return (
    <div className="p-8">
      <p className="text-slate-500 text-sm">Accès réservé aux administrateurs.</p>
    </div>
  )

  return (
    <div className="p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-8 -mt-8 mb-8" />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Catégories</h1>
          <p className="text-slate-500 text-sm mt-1">Gérez les catégories de matériel pédagogique</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setNouveau('') }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-100 cursor-pointer"
        >
          <FiPlus size={16} />
          Nouvelle catégorie
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow p-5 mb-6">
          <form onSubmit={ajouter} className="flex gap-3">
            <input
              type="text"
              value={nouveau}
              onChange={e => setNouveau(e.target.value)}
              placeholder="Nom de la catégorie"
              autoFocus
              required
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-slate-50"
            />
            <button
              type="submit"
              disabled={ajoutLoading}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer disabled:opacity-60"
            >
              {ajoutLoading ? <FiLoader size={15} className="animate-spin" /> : <FiCheck size={15} />}
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              <FiX size={15} />
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader size={28} className="animate-spin text-orange-400" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FiTag size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune catégorie — créez-en une</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Nom ({categories.length})
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map(cat => (
                <tr key={cat.id_categorie} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {editId === cat.id_categorie ? (
                      <input
                        type="text"
                        value={editNom}
                        onChange={e => setEditNom(e.target.value)}
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter') sauvegarderEdit(cat.id_categorie)
                          if (e.key === 'Escape') setEditId(null)
                        }}
                        className="px-3 py-1.5 rounded-lg border border-orange-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white w-72"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FiTag size={14} className="text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-800">{cat.nom_categorie}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {editId === cat.id_categorie ? (
                        <>
                          <button
                            onClick={() => sauvegarderEdit(cat.id_categorie)}
                            className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition cursor-pointer"
                            title="Sauvegarder"
                          >
                            <FiCheck size={15} />
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                            title="Annuler"
                          >
                            <FiX size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => commencerEdit(cat)}
                            className="p-2 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition cursor-pointer"
                            title="Modifier"
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            onClick={() => supprimer(cat.id_categorie)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                            title="Supprimer"
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
