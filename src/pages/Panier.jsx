import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { FiShoppingCart, FiTrash2, FiArrowLeft, FiLoader, FiCheck, FiBox } from 'react-icons/fi'

export default function Panier() {
  const { profil } = useAuth()
  const { panier, retirerDuPanier, modifierQuantite, viderPanier } = useCart()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')

  async function soumettrePanier() {
    if (panier.length === 0) return
    setSubmitting(true)
    setErreur('')

    const groupeId = crypto.randomUUID()
    const maintenant = new Date().toISOString()

    const { data: emprunts, error } = await supabase
      .from('emprunt')
      .insert(panier.map(item => ({
        id_materiel: item.id_materiel,
        id_utilisateur: profil.id_utilisateur,
        statut: 'en_attente',
        date_emprunt: maintenant,
        date_retour_prevue: item.dateRetourPrevue || null,
        quantite: item.quantite || 1,
        groupe_id: groupeId,
      })))
      .select()

    if (error) {
      setErreur('Erreur lors de l\'envoi. Réessaie.')
      setSubmitting(false)
      return
    }

    const { data: admins } = await supabase
      .from('utilisateur')
      .select('id_utilisateur')
      .in('role', ['admin', 'superadmin'])
      .eq('actif', true)

    if (admins?.length > 0 && emprunts?.length > 0) {
      const noms = panier.map(i => i.nom).join(', ')
      const msg = panier.length === 1
        ? `${profil.nom} demande à emprunter "${panier[0].nom}"${panier[0].quantite > 1 ? ` (×${panier[0].quantite})` : ''}`
        : `${profil.nom} demande ${panier.length} matériels : ${noms}`
      await supabase.from('notification').insert(
        admins.map(admin => ({
          type_notif: 'demande_recue',
          message: msg,
          id_utilisateur: admin.id_utilisateur,
          id_emprunt: emprunts[0].id_emprunt,
        }))
      )
      window.dispatchEvent(new Event('notifications-updated'))
    }

    await supabase.from('historique').insert(
      panier.map(item => ({
        type_action: 'emprunt',
        commentaire: `Demande d'emprunt de ${profil.nom} pour ${item.nom}${item.quantite > 1 ? ` (×${item.quantite})` : ''}`,
        id_materiel: item.id_materiel,
        id_utilisateur: profil.id_utilisateur,
      }))
    )

    viderPanier()
    setSubmitting(false)
    setEnvoye(true)
  }

  if (envoye) return (
    <div className="p-4 sm:p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 mb-8" />
      <div className="max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheck size={28} className="text-green-600" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 mb-2">Demandes envoyées !</h1>
        <p className="text-slate-500 text-sm mb-6">Tes demandes ont été transmises. Tu seras notifié dès qu'un admin répond.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/emprunts" className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition">
            Voir mes emprunts
          </Link>
          <Link to="/materiels" className="px-5 py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 transition">
            Continuer à parcourir
          </Link>
        </div>
      </div>
    </div>
  )

  const totalArticles = panier.reduce((a, i) => a + i.quantite, 0)

  return (
    <div className="p-4 sm:p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 mb-8" />

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-5 transition cursor-pointer">
        <FiArrowLeft size={15} /> Retour
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Mon panier</h1>
        <p className="text-slate-500 text-sm mt-1">
          {panier.length} matériel{panier.length > 1 ? 's' : ''} · {totalArticles} article{totalArticles > 1 ? 's' : ''} au total
        </p>
      </div>

      {panier.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <FiShoppingCart size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Ton panier est vide</p>
          <Link to="/materiels" className="mt-3 inline-block text-sm text-orange-500 font-semibold hover:text-orange-600">
            Voir les matériels disponibles →
          </Link>
        </div>
      ) : (
        <div className="max-w-2xl space-y-3">
          {panier.map(item => (
            <div key={item.id_materiel} className="bg-white rounded-2xl border border-slate-100 shadow p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {item.image_url
                  ? <img src={item.image_url} alt={item.nom} className="w-full h-full object-cover" />
                  : <FiBox size={20} className="text-slate-300" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/materiels/${item.id_materiel}`} className="text-sm font-semibold text-slate-800 hover:text-orange-500 transition block truncate">
                  {item.nom}
                </Link>
                {item.reference && <p className="text-xs text-slate-400">Réf. {item.reference}</p>}
                <p className="text-xs text-slate-400 mt-0.5">Stock dispo : {item.stock}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button onClick={() => modifierQuantite(item.id_materiel, item.quantite - 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition cursor-pointer">−</button>
                  <span className="w-8 text-center text-sm font-semibold text-slate-800">{item.quantite}</span>
                  <button onClick={() => modifierQuantite(item.id_materiel, item.quantite + 1)}
                    disabled={item.quantite >= item.stock}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition cursor-pointer disabled:opacity-40">+</button>
                </div>
                <button onClick={() => retirerDuPanier(item.id_materiel)}
                  className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition cursor-pointer">
                  <FiTrash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {erreur && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{erreur}</p>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow p-5 flex gap-3">
            <button
              onClick={() => { if (confirm('Vider le panier ?')) viderPanier() }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Vider
            </button>
            <button
              onClick={soumettrePanier}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-100 cursor-pointer disabled:opacity-60"
            >
              {submitting ? <FiLoader size={15} className="animate-spin" /> : <FiShoppingCart size={15} />}
              Envoyer {panier.length > 1 ? `les ${panier.length} demandes` : 'la demande'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
