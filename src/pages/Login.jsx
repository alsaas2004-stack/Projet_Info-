import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { FiPackage, FiAlertCircle, FiLoader, FiCheckCircle } from 'react-icons/fi'

// Motif d'arcs concentriques ICAM (inspiré du rapport)
function IcamArcs() {
  return (
    <svg
      className="absolute top-0 right-0 pointer-events-none"
      width="420" height="420"
      viewBox="0 0 420 420"
    >
      {/* Arc outermost — crème */}
      <path d="M 420 336 A 336 336 0 0 1 84 0" fill="none" stroke="#FDE8C7" strokeWidth="48"/>
      {/* Arc 2 — orange clair */}
      <path d="M 420 252 A 252 252 0 0 1 168 0" fill="none" stroke="#F5B856" strokeWidth="48"/>
      {/* Arc 3 — orange moyen */}
      <path d="M 420 168 A 168 168 0 0 1 252 0" fill="none" stroke="#E8870C" strokeWidth="48"/>
      {/* Arc innermost — orange foncé */}
      <path d="M 420 84 A 84 84 0 0 1 336 0" fill="none" stroke="#C96015" strokeWidth="48"/>
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [loading, setLoading] = useState(false)

  const [forgotMode, setForgotMode] = useState(false)
  const [signupMode, setSignupMode] = useState(false)
  const [signupNom, setSignupNom] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupSucces, setSignupSucces] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [recoverySucces, setRecoverySucces] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErreur('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      if (err?.message?.toLowerCase().includes('email not confirmed')) {
        setErreur('Vérifie ta boîte mail et clique sur le lien de confirmation avant de te connecter.')
      } else {
        setErreur('Email ou mot de passe incorrect.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRecovery(e) {
    e.preventDefault()
    setErreur('')
    setRecoveryLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setRecoveryLoading(false)
    if (error) {
      setErreur('Erreur : ' + error.message)
    } else {
      setRecoverySucces(true)
    }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setErreur('')

    if (!/@(\d{4}\.)?icam\.fr$/i.test(signupEmail)) {
      setErreur('Seules les adresses @icam.fr ou @AAAA.icam.fr sont acceptées pour l\'inscription.')
      return
    }

    setSignupLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nom: signupNom },
      },
    })

    setSignupLoading(false)
    if (error) {
      if (error.message?.toLowerCase().includes('rate limit')) {
        setErreur('Trop de tentatives. Veuillez réessayer dans quelques minutes.')
      } else {
        setErreur('Erreur : ' + error.message)
      }
    } else if (data?.user?.identities?.length === 0) {
      setErreur('Un compte existe déjà avec cet email. Veuillez vous connecter.')
    } else {
      setSignupSucces(true)
    }
  }

  function retourConnexion() {
    setForgotMode(false)
    setSignupMode(false)
    setRecoverySucces(false)
    setSignupSucces(false)
    setRecoveryEmail('')
    setSignupNom('')
    setSignupEmail('')
    setSignupPassword('')
    setErreur('')
  }

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center p-4">

      {/* Motif arcs ICAM */}
      <IcamArcs />

      {/* Bande orange bas */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-700" />

      <div className="w-full max-w-md relative z-10">

        {/* En-tête ICAM */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
              <FiPackage size={24} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-extrabold text-slate-900 leading-none tracking-tight">
                Icam<span className="text-orange-500">Track</span>
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Département Informatique
              </div>
            </div>
          </div>

          {/* Barre orange ICAM */}
          <div className="flex gap-1 justify-center mb-6">
            <div className="h-1 w-12 bg-orange-200 rounded-full" />
            <div className="h-1 w-8 bg-orange-400 rounded-full" />
            <div className="h-1 w-5 bg-orange-500 rounded-full" />
            <div className="h-1 w-3 bg-orange-700 rounded-full" />
          </div>
        </div>

        {/* Carte connexion */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-slate-100 overflow-hidden">

          {/* Bande orange en haut de la carte */}
          <div className="h-1 bg-gradient-to-r from-orange-300 via-orange-500 to-orange-600" />

          <div className="p-8">
            {forgotMode ? (
              /* ── Mode récupération ── */
              recoverySucces ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle size={28} className="text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Email envoyé !</h2>
                  <p className="text-sm text-slate-500 mb-6">
                    Consultez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                  </p>
                  <button
                    onClick={retourConnexion}
                    className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition cursor-pointer"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Mot de passe oublié</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Entrez votre email pour recevoir un lien de réinitialisation.
                  </p>

                  {erreur && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                      <FiAlertCircle size={16} className="flex-shrink-0" />
                      {erreur}
                    </div>
                  )}

                  <form onSubmit={handleRecovery} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Adresse email
                      </label>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={e => setRecoveryEmail(e.target.value)}
                        placeholder="vous@icam.fr"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm bg-slate-50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-sm shadow-lg shadow-orange-200 cursor-pointer"
                    >
                      {recoveryLoading ? (
                        <><FiLoader size={16} className="animate-spin" /> Envoi en cours…</>
                      ) : 'Envoyer le lien'}
                    </button>
                  </form>

                  <button
                    onClick={retourConnexion}
                    className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    Retour à la connexion
                  </button>
                </>
              )
            ) : signupMode ? (
              /* ── Mode inscription ── */
              signupSucces ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheckCircle size={28} className="text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Compte créé</h2>
                  <p className="text-sm text-slate-500 mb-6">
                    Consultez votre boîte mail pour confirmer votre adresse avant de vous connecter.
                  </p>
                  <button
                    onClick={retourConnexion}
                    className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition cursor-pointer"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">Créer un compte</h2>
                  <p className="text-sm text-slate-400 mb-6">
                    Réservé aux adresses <span className="font-semibold text-orange-500">@icam.fr</span>
                  </p>

                  {erreur && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                      <FiAlertCircle size={16} className="flex-shrink-0" />
                      {erreur}
                    </div>
                  )}

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={signupNom}
                        onChange={e => setSignupNom(e.target.value)}
                        placeholder="Jean Dupont"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Adresse email
                      </label>
                      <input
                        type="email"
                        value={signupEmail}
                        onChange={e => setSignupEmail(e.target.value)}
                        placeholder="vous@icam.fr"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Mot de passe
                      </label>
                      <input
                        type="password"
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={6}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm bg-slate-50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-sm shadow-lg shadow-orange-200 cursor-pointer"
                    >
                      {signupLoading ? (
                        <><FiLoader size={16} className="animate-spin" /> Création en cours…</>
                      ) : 'Créer le compte'}
                    </button>
                  </form>

                  <button
                    onClick={retourConnexion}
                    className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    Déjà un compte ? Se connecter
                  </button>
                </>
              )
            ) : (
              /* ── Mode connexion ── */
              <>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Connexion</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Accédez à la gestion du matériel pédagogique
                </p>

                {erreur && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                    <FiAlertCircle size={16} className="flex-shrink-0" />
                    {erreur}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="vous@icam.fr"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => { setForgotMode(true); setErreur('') }}
                      className="mt-2 text-xs text-orange-500 hover:text-orange-600 font-medium transition cursor-pointer float-right"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 text-sm shadow-lg shadow-orange-200 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <FiLoader size={16} className="animate-spin" />
                        Connexion en cours…
                      </>
                    ) : 'Se connecter'}
                  </button>
                </form>

                <div className="mt-5 pt-5 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-500">
                    Pas encore de compte ?
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSignupMode(true); setErreur('') }}
                    className="mt-2 text-sm font-semibold text-orange-500 hover:text-orange-600 transition cursor-pointer"
                  >
                    Créer un compte
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          ICAM Strasbourg — Département Informatique © 2026
        </p>
      </div>
    </div>
  )
}
