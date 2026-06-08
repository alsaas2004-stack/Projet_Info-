import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiLoader, FiArrowLeft, FiSave } from 'react-icons/fi'

export default function NouveauMateriel() {
  const { id } = useParams()
  const estEdition = !!id
  const { estAdmin, profil } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(estEdition)
  const [saving, setSaving] = useState(false)

  const [nom, setNom] = useState('')
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')
  const [etat, setEtat] = useState('disponible')
  const [imageUrl, setImageUrl] = useState('')
  const [dateAcquisition, setDateAcquisition] = useState('')
  const [idCategorie, setIdCategorie] = useState('')

  useEffect(() => {
    chargerCategories()
    if (estEdition) chargerMateriel()
  }, [id])

  async function chargerCategories() {
    const { data } = await supabase.from('categorie').select('*').order('nom_categorie')
    setCategories(data || [])
  }

  async function chargerMateriel() {
    const { data } = await supabase.from('materiel').select('*').eq('id_materiel', id).single()
    if (data) {
      setNom(data.nom)
      setReference(data.reference || '')
      setDescription(data.description || '')
      setEtat(data.etat)
      setImageUrl(data.image_url || '')
      setDateAcquisition(data.date_acquisition ? data.date_acquisition.split('T')[0] : '')
      setIdCategorie(data.id_categorie || '')
    }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!estAdmin) return
    setSaving(true)

    const payload = {
      nom: nom.trim(),
      reference: reference.trim() || null,
      description: description.trim() || null,
      etat,
      image_url: imageUrl.trim() || null,
      date_acquisition: dateAcquisition || null,
      id_categorie: idCategorie || null,
    }

    if (estEdition) {
      await supabase.from('materiel').update(payload).eq('id_materiel', id)
    } else {
      const { data: inserted } = await supabase.from('materiel').insert(payload).select().single()
      if (inserted) {
        await supabase.from('historique').insert({
          type_action: 'creation',
          commentaire: `Création du matériel : ${inserted.nom}`,
          id_materiel: inserted.id_materiel,
          id_utilisateur: profil.id_utilisateur,
        })
      }
    }

    setSaving(false)
    navigate('/materiels')
  }

  if (!estAdmin) return (
    <div className="p-8"><p className="text-slate-500 text-sm">Accès réservé aux administrateurs.</p></div>
  )

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <FiLoader size={32} className="animate-spin text-orange-400" />
    </div>
  )

  return (
    <div className="p-4 sm:p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 mb-8" />

      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-5 transition cursor-pointer"
        >
          <FiArrowLeft size={15} /> Retour
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {estEdition ? 'Modifier le matériel' : 'Nouveau matériel'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {estEdition ? 'Mettre à jour les informations' : 'Ajouter un matériel au catalogue'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow p-6 space-y-5 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom *</label>
          <input
            type="text"
            value={nom}
            onChange={e => setNom(e.target.value)}
            required
            placeholder="Ex : Arduino Uno"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-slate-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Référence</label>
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Ex : ARD-001"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Catégorie</label>
            <select
              value={idCategorie}
              onChange={e => setIdCategorie(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-slate-50 cursor-pointer"
            >
              <option value="">Sans catégorie</option>
              {categories.map(c => (
                <option key={c.id_categorie} value={c.id_categorie}>{c.nom_categorie}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Description optionnelle…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-slate-50 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">État</label>
            <select
              value={etat}
              onChange={e => setEtat(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-slate-50 cursor-pointer"
            >
              <option value="disponible">Disponible</option>
              <option value="indisponible">Indisponible</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date d'acquisition</label>
            <input
              type="date"
              value={dateAcquisition}
              onChange={e => setDateAcquisition(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">URL de l'image</label>
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-slate-50"
          />
          {imageUrl && (
            <img src={imageUrl} alt="Aperçu" className="mt-2 h-20 rounded-lg object-cover border border-slate-100" onError={e => e.target.style.display='none'} />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-100 cursor-pointer disabled:opacity-60"
          >
            {saving ? <FiLoader size={15} className="animate-spin" /> : <FiSave size={15} />}
            {estEdition ? 'Enregistrer' : 'Créer le matériel'}
          </button>
        </div>
      </form>
    </div>
  )
}
