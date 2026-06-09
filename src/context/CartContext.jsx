import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [panier, setPanier] = useState(() => {
    try { return JSON.parse(localStorage.getItem('icamtrack_panier') || '[]') }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('icamtrack_panier', JSON.stringify(panier))
  }, [panier])

  function ajouterAuPanier(materiel, quantite = 1, dateRetourPrevue = null) {
    setPanier(prev => {
      const existant = prev.find(i => i.id_materiel === materiel.id_materiel)
      if (existant) {
        return prev.map(i => i.id_materiel === materiel.id_materiel
          ? { ...i, quantite: i.quantite + quantite, dateRetourPrevue: dateRetourPrevue || i.dateRetourPrevue }
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
      }]
    })
  }

  function retirerDuPanier(id) {
    setPanier(prev => prev.filter(i => i.id_materiel !== id))
  }

  function modifierQuantite(id, quantite) {
    if (quantite < 1) return
    setPanier(prev => prev.map(i => i.id_materiel === id ? { ...i, quantite } : i))
  }

  function viderPanier() {
    setPanier([])
    localStorage.removeItem('icamtrack_panier')
  }

  const nbArticles = panier.length

  return (
    <CartContext.Provider value={{ panier, ajouterAuPanier, retirerDuPanier, modifierQuantite, viderPanier, nbArticles }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
