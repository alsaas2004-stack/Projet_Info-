import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  FiBox, FiLoader, FiArrowLeft, FiEdit2, FiEyeOff,
  FiClipboard, FiCalendar, FiX, FiCheck, FiPrinter, FiTag
} from 'react-icons/fi'

function BadgeEtat({ etat }) {
  const cfg = {
    disponible:  { cls: 'bg-green-100 text-green-700',  label: 'Disponible'   },
    emprunte:    { cls: 'bg-orange-100 text-orange-700', label: 'Emprunté'     },
    indisponible:{ cls: 'bg-red-100 text-red-700',       label: 'Indisponible' },
  }
  const { cls, label } = cfg[etat] || { cls: 'bg-slate-100 text-slate-500', label: etat }
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${cls}`}>
      <span className="w-2 h-2 rounded-full bg-current" />
      {label}
    </span>
  )
}

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

export default function DetailMateriel() {
  const { id } = useParams()
  const { estAdmin, profil } = useAuth()
  const navigate = useNavigate()

  const [materiel, setMateriel] = useState(null)
  const [emprunts, setEmprunts] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [dateRetourPrevue, setDateRetourPrevue] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false)

  useEffect(() => { charger() }, [id])

  async function charger() {
    setLoading(true)
    const [{ data: mat }, { data: emps }] = await Promise.all([
      supabase.from('materiel')
        .select('*, categorie(nom_categorie)')
        .eq('id_materiel', id)
        .single(),
      supabase.from('emprunt')
        .select('*, utilisateur!emprunt_id_utilisateur_fkey(nom, email)')
        .eq('id_materiel', id)
        .order('date_emprunt', { ascending: false })
        .limit(10),
    ])
    setMateriel(mat)
    setEmprunts(emps || [])
    setLoading(false)
  }

  async function desactiver() {
    if (!confirm('Désactiver ce matériel ? Il n\'apparaîtra plus dans la liste.')) return
    await supabase.from('materiel').update({ actif: false }).eq('id_materiel', id)
    navigate('/materiels')
  }

  async function demanderEmprunt(e) {
    e.preventDefault()
    setSubmitting(true)

    // Vérifier qu'une demande en attente ou en cours n'existe pas déjà
    const { data: dejaEmprunt } = await supabase
      .from('emprunt')
      .select('id_emprunt')
      .eq('id_materiel', id)
      .eq('id_utilisateur', profil.id_utilisateur)
      .in('statut', ['en_attente', 'en_cours'])
      .maybeSingle()

    if (dejaEmprunt) {
      setSubmitting(false)
      setShowModal(false)
      setDemandeEnvoyee(true)
      return
    }

    const { data: nouvelEmprunt, error: errEmprunt } = await supabase
      .from('emprunt')
      .insert({
        id_materiel: id,
        id_utilisateur: profil.id_utilisateur,
        statut: 'en_attente',
        date_emprunt: new Date().toISOString(),
        date_retour_prevue: dateRetourPrevue || null,
        quantite: quantite || 1,
      })
      .select()
      .single()

    if (errEmprunt) {
      console.error('Erreur insert emprunt:', errEmprunt)
      setSubmitting(false)
      return
    }

    // Notifier tous les admins et superadmins
    const { data: admins } = await supabase
      .from('utilisateur')
      .select('id_utilisateur')
      .in('role', ['admin', 'superadmin'])
      .eq('actif', true)

    if (admins && admins.length > 0) {
      await supabase.from('notification').insert(
        admins.map(admin => ({
          type_notif: 'demande_recue',
          message: `${profil.nom} demande à emprunter "${materiel.nom}"${(quantite || 1) > 1 ? ` (×${quantite})` : ''}`,
          id_utilisateur: admin.id_utilisateur,
          id_emprunt: nouvelEmprunt.id_emprunt,
        }))
      )
    }

    await supabase.from('historique').insert({
      type_action: 'emprunt',
      commentaire: `Demande d'emprunt de ${profil.nom} pour ${materiel.nom}`,
      id_materiel: id,
      id_utilisateur: profil.id_utilisateur,
    })

    setSubmitting(false)
    setShowModal(false)
    setDemandeEnvoyee(true)
    charger()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-96">
      <FiLoader size={32} className="animate-spin text-orange-400" />
    </div>
  )

  if (!materiel) return (
    <div className="p-8">
      <p className="text-slate-500 text-sm">Matériel introuvable.</p>
    </div>
  )

  const qrUrl = `${window.location.origin}/materiels/${id}`

  return (
    <div className="p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-8 -mt-8 mb-8" />

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-sm font-medium mb-6 transition cursor-pointer"
      >
        <FiArrowLeft size={15} /> Retour aux matériels
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne principale ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Fiche matériel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow overflow-hidden">
            <div className="h-52 bg-slate-100 relative">
              {materiel.image_url ? (
                <img src={materiel.image_url} alt={materiel.nom} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FiBox size={52} className="text-slate-300" />
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{materiel.nom}</h1>
                  {materiel.reference && (
                    <p className="text-sm text-slate-400 mt-1">Référence : {materiel.reference}</p>
                  )}
                </div>
                <BadgeEtat etat={materiel.etat} />
              </div>

              {materiel.categorie && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full mb-4">
                  <FiTag size={11} />
                  {materiel.categorie.nom_categorie}
                </span>
              )}

              {materiel.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{materiel.description}</p>
              )}

              {materiel.date_acquisition && (
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-5">
                  <FiCalendar size={12} />
                  Acquis le {new Date(materiel.date_acquisition).toLocaleDateString('fr-FR')}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                {!estAdmin && materiel.etat === 'disponible' && !demandeEnvoyee && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-100 cursor-pointer"
                  >
                    <FiClipboard size={15} />
                    Demander l'emprunt
                  </button>
                )}
                {!estAdmin && demandeEnvoyee && (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2.5 rounded-xl text-sm font-semibold border border-green-200">
                    <FiCheck size={15} />
                    Demande envoyée — en attente de validation
                  </div>
                )}
                {!estAdmin && materiel.etat !== 'disponible' && !demandeEnvoyee && (
                  <p className="text-sm text-slate-400 py-2">
                    Ce matériel n'est pas disponible à l'emprunt pour le moment.
                  </p>
                )}
                {estAdmin && (
                  <>
                    <Link
                      to={`/materiels/${id}/modifier`}
                      className="flex items-center gap-2 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 font-semibold px-4 py-2.5 rounded-xl text-sm transition"
                    >
                      <FiEdit2 size={15} />
                      Modifier
                    </Link>
                    <button
                      onClick={desactiver}
                      className="flex items-center gap-2 text-red-500 hover:bg-red-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition border border-red-100 cursor-pointer"
                    >
                      <FiEyeOff size={15} />
                      Désactiver
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Historique des emprunts (admin uniquement) */}
          {estAdmin && emprunts.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow p-6">
              <h2 className="text-sm font-bold text-slate-700 mb-4">Historique des emprunts</h2>
              <div className="divide-y divide-slate-50">
                {emprunts.map(e => (
                  <div key={e.id_emprunt} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{e.utilisateur?.nom}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(e.date_emprunt).toLocaleDateString('fr-FR')}
                        {e.date_retour_reelle && ` → ${new Date(e.date_retour_reelle).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                    <BadgeStatut statut={e.statut} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── QR Code ── */}
        <div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow p-6 text-center">
            <h2 className="text-sm font-bold text-slate-700 mb-4">QR Code</h2>
            <div className="bg-slate-50 p-4 rounded-xl inline-block border border-slate-100">
              <QRCodeSVG value={qrUrl} size={160} level="M" />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-3">{materiel.nom}</p>
            {materiel.reference && (
              <p className="text-xs text-slate-400 mt-0.5">Réf. {materiel.reference}</p>
            )}
            <button
              onClick={() => window.print()}
              className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-orange-500 font-medium transition mx-auto cursor-pointer"
            >
              <FiPrinter size={14} />
              Imprimer
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal demande emprunt ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-600" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-slate-800">Demande d'emprunt</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5">
                <p className="text-sm font-semibold text-slate-800">{materiel.nom}</p>
                {materiel.reference && <p className="text-xs text-slate-400 mt-0.5">Réf. {materiel.reference}</p>}
              </div>
              <form onSubmit={demanderEmprunt} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantité</label>
                  <input
                    type="number"
                    value={quantite}
                    onChange={e => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Date de retour prévue
                    <span className="text-slate-400 font-normal ml-1">(optionnel)</span>
                  </label>
                  <input
                    type="date"
                    value={dateRetourPrevue}
                    onChange={e => setDateRetourPrevue(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm bg-slate-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition shadow-lg shadow-orange-100 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><FiLoader size={15} className="animate-spin" /> Envoi…</>
                    : <><FiClipboard size={15} /> Envoyer la demande</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
