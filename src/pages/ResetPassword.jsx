import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiPackage, FiAlertCircle, FiLoader, FiCheckCircle, FiLock } from 'react-icons/fi'

function IcamArcs() {
  return (
    <svg className="absolute top-0 right-0 pointer-events-none" width="420" height="420" viewBox="0 0 420 420">
      <path d="M 420 336 A 336 336 0 0 1 84 0" fill="none" stroke="#FDE8C7" strokeWidth="48"/>
      <path d="M 420 252 A 252 252 0 0 1 168 0" fill="none" stroke="#F5B856" strokeWidth="48"/>
      <path d="M 420 168 A 168 168 0 0 1 252 0" fill="none" stroke="#E8870C" strokeWidth="48"/>
      <path d="M 420 84 A 84 84 0 0 1 336 0" fill="none" stroke="#C96015" strokeWidth="48"/>
    </svg>
  )
}

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const { modeRecuperation } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setErreur('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    setErreur('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setErreur('Erreur : ' + error.message)
    } else {
      setSucces(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login'), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">
      <IcamArcs />
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700" />

      <div className="w-full max-w-md relative z-10">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <FiPackage size={24} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-extrabold text-slate-900 leading-none tracking-tight">
                Icam<span className="text-orange-500">Track</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Département Informatique</div>
            </div>
          </div>
          <div className="flex gap-1 justify-center mb-6">
            <div className="h-1 w-12 bg-orange-200 rounded-full" />
            <div className="h-1 w-8 bg-orange-400 rounded-full" />
            <div className="h-1 w-5 bg-orange-500 rounded-full" />
            <div className="h-1 w-3 bg-orange-700 rounded-full" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-600" />
          <div className="p-8">

            {succes ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheckCircle size={28} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Mot de passe mis à jour !</h2>
                <p className="text-sm text-slate-500">Redirection vers la connexion…</p>
              </div>

            ) : !modeRecuperation ? (
              <div className="text-center py-4">
                <FiLoader size={28} className="animate-spin text-orange-500 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Vérification du lien en cours…</p>
              </div>

            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiLock size={18} className="text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 leading-none">Nouveau mot de passe</h2>
                    <p className="text-sm text-slate-400 mt-0.5">Choisissez un mot de passe sécurisé</p>
                  </div>
                </div>

                {erreur && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                    <FiAlertCircle size={16} className="flex-shrink-0" />
                    {erreur}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm bg-slate-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-sm shadow-lg shadow-orange-200 cursor-pointer"
                  >
                    {loading ? (
                      <><FiLoader size={16} className="animate-spin" /> Mise à jour…</>
                    ) : 'Mettre à jour le mot de passe'}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          ICAM Lille — Département Informatique © 2026
        </p>
      </div>
    </div>
  )
}
