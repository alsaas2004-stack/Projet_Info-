import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profilErreur, setProfilErreur] = useState('')
  const [modeRecuperation, setModeRecuperation] = useState(false)

  useEffect(() => {
    // Vérifie s'il existe déjà une session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        await chargerProfil(session.user)  // attendu avant de retirer le loading
      }
      setLoading(false)
    })

    // Écoute les changements de connexion/déconnexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (_event === 'PASSWORD_RECOVERY') {
          setModeRecuperation(true)
          setUser(session?.user || null)
          setLoading(false)
          return
        }
        setModeRecuperation(false)
        if (session?.user) {
          setUser(session.user)
          await chargerProfil(session.user)
        } else {
          setUser(null)
          setProfil(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function chargerProfil(authUser) {
    const email = authUser?.email || authUser

    const { data, error } = await supabase
      .from('utilisateur')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (data) {
      setProfil(data)
      setProfilErreur('')
      return data
    }

    if (error) {
      setProfil(null)
      setProfilErreur(`Impossible de charger le profil IcamTrack pour ${email}.`)
      console.error('Erreur profil :', error.message)
      return null
    }

    // Pas de ligne trouvée — ne créer le profil que si l'email est confirmé
    if (!authUser?.email_confirmed_at) {
      setProfil(null)
      return null
    }

    const roleInitial = 'etudiant'
    const nomInitial =
      authUser?.user_metadata?.nom ||
      authUser?.user_metadata?.full_name ||
      email?.split('@')[0] ||
      'Utilisateur'

    const { data: nouveauProfil, error: insertError } = await supabase
      .from('utilisateur')
      .insert({
        nom: nomInitial,
        email,
        role: roleInitial,
        actif: true,
      })
      .select('*')
      .single()

    if (nouveauProfil) {
      setProfil(nouveauProfil)
      setProfilErreur('')
      return nouveauProfil
    }

    setProfil(null)
    if (insertError?.code === '42501') {
      setProfilErreur(
        `Supabase bloque l'accès à la table utilisateur pour ${email}. Désactive RLS sur utilisateur ou ajoute une policy.`
      )
    } else {
      setProfilErreur(`Aucun profil IcamTrack trouvé pour ${email}.`)
    }
    if (insertError) console.error('Création profil impossible :', insertError.message)
    return null
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      profil,
      loading,
      login,
      logout,
      modeRecuperation,
      profilErreur,
      // superadmin a tous les droits admin + gestion des utilisateurs
      estSuperAdmin: profil?.role === 'superadmin',
      estAdmin: profil?.role === 'admin' || profil?.role === 'superadmin',
      estEtudiant: profil?.role === 'etudiant',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
