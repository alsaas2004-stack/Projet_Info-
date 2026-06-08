import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiBell, FiLoader, FiCheck, FiCheckSquare, FiTrash2, FiTrash } from 'react-icons/fi'

const CFG_TYPE = {
  demande_recue: { cls: 'bg-blue-100 text-blue-700',    label: 'Nouvelle demande' },
  accepte:       { cls: 'bg-green-100 text-green-700',  label: 'Accepté'          },
  refuse:        { cls: 'bg-red-100 text-red-700',      label: 'Refusé'           },
  retard:        { cls: 'bg-orange-100 text-orange-700',label: 'Retard'           },
}

export default function Notifications() {
  const { profil, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (profil?.id_utilisateur) {
      charger()
    } else {
      setNotifications([])
      setLoading(false)
    }
  }, [authLoading, profil?.id_utilisateur])

  async function charger() {
    if (!profil?.id_utilisateur) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from('notification')
        .select('*')
        .eq('id_utilisateur', profil.id_utilisateur)
        .order('date_creation', { ascending: false })
      setNotifications(data || [])
    } finally {
      setLoading(false)
    }
  }

  function notifie() {
    window.dispatchEvent(new Event('notifications-updated'))
  }

  async function marquerLu(id) {
    const { error } = await supabase.from('notification').update({ lu: true }).eq('id_notification', id)
    if (error) { console.error('marquerLu:', error); return }
    setNotifications(prev => prev.map(n => n.id_notification === id ? { ...n, lu: true } : n))
    notifie()
  }

  async function toutMarquerLu() {
    const { error } = await supabase
      .from('notification')
      .update({ lu: true })
      .eq('id_utilisateur', profil.id_utilisateur)
      .eq('lu', false)
    if (error) { console.error('toutMarquerLu:', error); return }
    setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
    notifie()
  }

  async function supprimer(id) {
    const { error } = await supabase.from('notification').delete().eq('id_notification', id)
    if (error) { console.error('supprimer:', error); return }
    setNotifications(prev => prev.filter(n => n.id_notification !== id))
    notifie()
  }

  async function toutSupprimer() {
    if (!confirm('Supprimer toutes les notifications ?')) return
    const { error } = await supabase
      .from('notification')
      .delete()
      .eq('id_utilisateur', profil.id_utilisateur)
    if (error) { console.error('toutSupprimer:', error); return }
    setNotifications([])
    notifie()
  }

  const nonLues = notifications.filter(n => !n.lu).length

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700 -mx-4 -mt-4 sm:-mx-8 sm:-mt-8 mb-8" />

      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {nonLues > 0
              ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}`
              : notifications.length > 0 ? 'Tout est à jour' : ''}
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {nonLues > 0 && (
              <button
                onClick={toutMarquerLu}
                className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-semibold transition cursor-pointer px-3 py-2 rounded-xl hover:bg-orange-50"
              >
                <FiCheckSquare size={15} />
                Tout lire
              </button>
            )}
            <button
              onClick={toutSupprimer}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-500 font-semibold transition cursor-pointer px-3 py-2 rounded-xl hover:bg-red-50"
            >
              <FiTrash size={15} />
              Tout supprimer
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FiLoader size={28} className="animate-spin text-orange-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <FiBell size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {notifications.map(n => {
              const cfg = CFG_TYPE[n.type_notif] || { cls: 'bg-slate-100 text-slate-600', label: n.type_notif }
              return (
                <div
                  key={n.id_notification}
                  className={`flex items-center gap-3 px-6 py-4 transition-colors ${!n.lu ? 'bg-orange-50/40' : 'hover:bg-slate-50/50'}`}
                >
                  {/* Point non-lu */}
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${!n.lu ? 'bg-orange-500' : 'bg-transparent'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(n.date_creation)}</span>
                    </div>
                    {n.message && (
                      <p className="text-sm text-slate-700 leading-relaxed">{n.message}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.lu && (
                      <button
                        onClick={() => marquerLu(n.id_notification)}
                        title="Marquer comme lu"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-orange-600 hover:bg-orange-50 transition cursor-pointer"
                      >
                        <FiCheck size={13} />
                        Lu
                      </button>
                    )}
                    <button
                      onClick={() => supprimer(n.id_notification)}
                      title="Supprimer"
                      className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
