import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CartContext = createContext()
const DUREE_RESERVATION_MS = 10 * 60 * 1000

export function CartProvider({ children }) {
  const [panier, setPanier] = useState(() => {
    try { return JSON.parse(localStorage.getItem('icamtrack_panier') || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('icamtrack_panier', JSON.stringify(panier))
  }, [panier])

  // Vérifie les expirations au montage et toutes les 30 secondes
  useEffect(() => {
    verifierExpirations()
    const id = setInterval(verifierExpirations, 30_000)
    return () => clearInterval(id)
  }, [])

  function verifierExpirations() {
    const maintenant = Date.now()
    setPanier(prev => {
      const expires = prev.filter(i => i.expiresAt && maintenant > i.expiresAt).map(i => i.id_materiel)
      if (expires.length > 0) {
        supabase.rpc('liberer_materiels', { p_ids: expires }).then()
      }
      return prev.filter(i => !i.expiresAt || maintenant <= i.expiresAt)
    })
  }

  function ajouterAuPanier(materiel, quantite = 1, dateRetourPrevue = null) {
    // Réserve via SECURITY DEFINER (contourne RLS pour les étudiants)
    supabase.rpc('reserver_materiel', { p_id_materiel: materiel.id_materiel })
      .then(({ error }) => { if (error) console.error('Erreur réservation matériel:', error.message) })

    const expiresAt = Date.now() + DUREE_RESERVATION_MS

    setPanier(prev => {
      const existant = prev.find(i => i.id_materiel === materiel.id_materiel)
      if (existant) {
        return prev.map(i => i.id_materiel === materiel.id_materiel
          ? { ...i, quantite: i.quantite + quantite, dateRetourPrevue: dateRetourPrevue || i.dateRetourPrevue, expiresAt }
          : i
        )
      }
      return [...prev, {
        id_materiel: materiel.id_materiel,
        nom: materiel.nom,
        reference: materiel.reference || null,
        image_url: materiel.image_url || null,
        stock: materiel.stock ?? 1,
        quantite,
        dateRetourPrevue,
        expiresAt,
      }]
    })
  }

  function retirerDuPanier(id) {
    supabase.rpc('liberer_materiel', { p_id_materiel: id })
      .then(({ error }) => { if (error) console.error('Erreur libération matériel:', error.message) })
    setPanier(prev => prev.filter(i => i.id_materiel !== id))
  }

  function modifierQuantite(id, quantite) {
    if (quantite < 1) return
    setPanier(prev => prev.map(i => i.id_materiel === id ? { ...i, quantite } : i))
  }

  function viderPanier() {
    const ids = panier.map(i => i.id_materiel)
    if (ids.length > 0) {
      supabase.rpc('liberer_materiels', { p_ids: ids })
        .then(({ error }) => { if (error) console.error('Erreur libération panier:', error.message) })
    }
    setPanier([])
    localStorage.removeItem('icamtrack_panier')
  }

  // Utilisé après soumission : ne libère PAS l'etat (l'emprunt est en attente admin)
  function soumettreEtViderPanier() {
    setPanier([])
    localStorage.removeItem('icamtrack_panier')
  }

  const nbArticles = panier.length

  return (
    <CartContext.Provider value={{ panier, ajouterAuPanier, retirerDuPanier, modifierQuantite, viderPanier, soumettreEtViderPanier, nbArticles }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
