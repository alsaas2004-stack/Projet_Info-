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
        supabase.from('materiel').update({ etat: 'disponible' }).in('id_materiel', expires).then()
      }
      return prev.filter(i => !i.expiresAt || maintenant <= i.expiresAt)
    })
  }

  function ajouterAuPanier(materiel, quantite = 1, dateRetourPrevue = null) {
    // Réserve le matériel en le passant "en attente" pendant 10 min
    supabase.from('materiel').update({ etat: 'en_attente' }).eq('id_materiel', materiel.id_materiel).then()

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
    // Libère la réservation
    supabase.from('materiel').update({ etat: 'disponible' }).eq('id_materiel', id).then()
    setPanier(prev => prev.filter(i => i.id_materiel !== id))
  }

  function modifierQuantite(id, quantite) {
    if (quantite < 1) return
    setPanier(prev => prev.map(i => i.id_materiel === id ? { ...i, quantite } : i))
  }

  function viderPanier() {
    // Libère toutes les réservations
    const ids = panier.map(i => i.id_materiel)
    if (ids.length > 0) {
      supabase.from('materiel').update({ etat: 'disponible' }).in('id_materiel', ids).then()
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
