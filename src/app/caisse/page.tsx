'use client'

import { useState, useEffect } from 'react'
import { Search, Receipt, Trash2, Trash, ArrowLeft, Loader2, Printer } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// Définition des types pour une meilleure structure
type Product = {
  id: string | number
  name: string
  price: number
  acronym?: string
  color?: string
}

type CartItem = {
  product: Product
  quantity: number
}

type ReceiptData = {
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  date: Date
  orderId: string
}

// Fonctions utilitaires pour pallier l'absence de couleur/acronyme en DB
const generateAcronym = (name: string) => name.substring(0, 2).toUpperCase()
const generateColor = (name: string) => {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-indigo-500']
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export default function PosPage() {
  // États de la base de données
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // État du panier, hydratation et encaissement
  const [cart, setCart] = useState<CartItem[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  
  // État du dernier reçu pour impression
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)
  
  const supabase = createClient()

  // 0. Charger le catalogue depuis Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true })

        if (error) {
          console.error('Erreur lors de la récupération des produits:', error)
        } else if (data) {
          setProducts(data)
        }
      } catch (err) {
        console.error('Erreur inattendue:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // 1. Charger depuis le localStorage au montage (côté client uniquement)
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('sugu_offline_cart')
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch (error) {
          console.error("Erreur de parsing du panier hors-ligne", error)
        }
      }
    }
  }, [])

  // 2. Sauvegarder automatiquement à chaque modification (si monté pour éviter d'écraser au 1er rendu serveur)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('sugu_offline_cart', JSON.stringify(cart))
    }
  }, [cart, isMounted])

  // =========================================
  // ACTIONS DU PANIER
  // =========================================

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string | number) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sugu_offline_cart')
    }
  }

  // =========================================
  // LOGIQUE D'ENCAISSEMENT (CHECKOUT)
  // =========================================
  
  // Calculs en temps réel
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.18 // TVA 18%
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setIsCheckingOut(true)
    
    // L'ID du tenant de démo que nous avons inséré dans la base
    const DEMO_TENANT_ID = '11111111-1111-1111-1111-111111111111'

    try {
      // Génération de l'ID côté client (évite le blocage RLS sur le SELECT)
      const orderId = crypto.randomUUID()

      // 1. Créer le ticket (dans la table 'orders' selon notre schéma SaaS)
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          tenant_id: DEMO_TENANT_ID,
          total_amount: total,
          payment_method: 'CASH', // Méthode par défaut
          status: 'COMPLETED'
        })

      if (orderError) throw orderError

      // 2. Préparer les lignes du ticket (dans la table 'order_items')
      const orderItemsToInsert = cart.map((item) => ({
        tenant_id: DEMO_TENANT_ID,
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity
      }))

      // 3. Insérer toutes les lignes d'un coup
      const { error: linesError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert)

      if (linesError) throw linesError

      // 4. Succès : Nettoyage et préparation de l'impression
      setLastReceipt({
        items: [...cart],
        subtotal,
        tax,
        total,
        date: new Date(),
        orderId
      })

      setCart([])
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sugu_offline_cart')
      }
      
      // Attendre un instant pour que React affiche le ticket caché, puis lancer l'impression
      setTimeout(() => {
        window.print()
      }, 500)

    } catch (error) {
      console.error("Erreur lors de l'encaissement :", error)
      alert("❌ Une erreur est survenue lors de l'encaissement. Veuillez vérifier votre connexion.")
    } finally {
      setIsCheckingOut(false)
    }
  }


  // On évite les disparités d'hydratation (Hydration Mismatch)
  if (!isMounted) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center font-sans text-gray-500">Chargement de la caisse...</div>
  }

  return (
    <>
      {/* =========================================
          APPLICATION (Masquée pendant l'impression)
          ========================================= */}
      <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden font-sans print:hidden">
        
        {/* COLONNE GAUCHE : CATALOGUE (70%) */}
        <div className="flex flex-col w-full lg:w-[70%] h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-gray-200">
          
          {/* Topbar / Barre de recherche */}
          <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
            <Link href="/dashboard" className="p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un produit ou scanner un code-barres..."
                className="block w-full rounded-2xl border-0 py-3.5 pl-11 pr-4 text-gray-900 bg-gray-100 placeholder:text-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-600 sm:text-lg transition-all"
              />
            </div>
          </div>

          {/* Grille de produits */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-blue-600 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-gray-500 font-medium animate-pulse">Chargement du catalogue...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-lg font-medium">Aucun produit dans le catalogue.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="group flex flex-col items-center bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all active:scale-95 text-left"
                  >
                    <div className={`w-full h-28 ${product.color || generateColor(product.name)} opacity-80 group-hover:opacity-100 transition-opacity flex items-center justify-center`}>
                      <span className="text-white font-bold opacity-50 text-2xl uppercase">
                        {product.acronym || generateAcronym(product.name)}
                      </span>
                    </div>
                    <div className="p-4 w-full flex flex-col gap-1">
                      <span className="font-semibold text-gray-800 line-clamp-1 leading-tight">{product.name}</span>
                      <span className="text-blue-600 font-bold text-lg">{product.price} F</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* COLONNE DROITE : TICKET DE CAISSE (30%) */}
        <div className="flex flex-col w-full lg:w-[30%] h-[50vh] lg:h-full bg-white relative shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          
          {/* En-tête du ticket */}
          <div className="flex items-center justify-between p-5 bg-white border-b border-gray-100 shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Receipt className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Ticket en cours</h2>
            </div>
            <div className="flex items-center gap-2">
              {lastReceipt && (
                <button 
                  onClick={() => window.print()}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Imprimer le dernier ticket"
                >
                  <Printer size={18} />
                </button>
              )}
              <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-sm font-medium">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} articles
              </span>
            </div>
          </div>

          {/* Liste des articles */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <Receipt className="h-12 w-12 opacity-20" />
                <p className="text-sm font-medium">Le ticket est vide</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col flex-1 mr-4">
                    <span className="font-bold text-gray-800 leading-tight">{item.product.name}</span>
                    <span className="text-sm text-gray-500 font-medium">{item.product.price} F x {item.quantity}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-900">{item.product.price * item.quantity} F</span>
                    <button 
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Résumé financier & Bouton Encaissement */}
          <div className="p-5 bg-white border-t border-gray-100 shrink-0 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-500 text-sm">
                <span>Sous-total</span>
                <span className="font-medium">{subtotal} F</span>
              </div>
              <div className="flex justify-between text-gray-500 text-sm">
                <span>TVA (18%)</span>
                <span className="font-medium">{tax} F</span>
              </div>
              <div className="flex justify-between text-gray-900 text-2xl font-black pt-2 border-t border-gray-100 mt-2">
                <span>Total</span>
                <span>{total} F CFA</span>
              </div>
            </div>
            
            <div className="pt-2 space-y-3">
              <button 
                onClick={clearCart}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full bg-white border-2 border-red-100 hover:bg-red-50 text-red-500 font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash className="h-4 w-4" />
                VIDER LA CAISSE
              </button>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed active:bg-green-700 text-white font-bold text-xl py-4 rounded-2xl shadow-lg shadow-green-500/30 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isCheckingOut ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : 'ENCAISSER'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          MODULE D'IMPRESSION (TICKET THERMIQUE)
          Uniquement visible au moment de l'impression
          ========================================= */}
      {lastReceipt && (
        <div className="hidden print:block w-[80mm] mx-auto p-4 bg-white text-black font-mono text-sm leading-tight">
          <div className="text-center mb-4">
            <h1 className="font-bold text-2xl mb-1 uppercase tracking-wider">SUGU</h1>
            <p className="text-xs uppercase">Point de Vente</p>
            <div className="border-b border-dashed border-black pb-2 mb-2 mt-3 text-xs">
              <p>Le {lastReceipt.date.toLocaleDateString('fr-FR')} à {lastReceipt.date.toLocaleTimeString('fr-FR')}</p>
              <p className="font-bold mt-1">Ticket #{lastReceipt.orderId.split('-')[0].toUpperCase()}</p>
            </div>
          </div>
          
          <table className="w-full text-xs mb-4">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left py-1 w-8">Qté</th>
                <th className="text-left py-1">Article</th>
                <th className="text-right py-1">Montant</th>
              </tr>
            </thead>
            <tbody>
              {lastReceipt.items.map(item => (
                <tr key={item.product.id}>
                  <td className="py-1 align-top font-bold">{item.quantity}x</td>
                  <td className="py-1 align-top pr-2">{item.product.name}</td>
                  <td className="text-right py-1 align-top">{(item.product.price * item.quantity).toLocaleString('fr-FR')} F</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="border-t border-dashed border-black pt-2 mb-4 text-xs">
            <div className="flex justify-between mb-1">
              <span>SOUS-TOTAL</span>
              <span>{lastReceipt.subtotal.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>TVA (18%)</span>
              <span>{lastReceipt.tax.toLocaleString('fr-FR')} F</span>
            </div>
            <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-dashed border-black">
              <span>TOTAL TTC</span>
              <span>{lastReceipt.total.toLocaleString('fr-FR')} F</span>
            </div>
          </div>
          
          <div className="text-center text-xs mt-8 mb-4">
            <p>Merci de votre visite !</p>
            <p className="mt-1">Propulsé par SUGU SaaS</p>
          </div>
        </div>
      )}
    </>
  )
}
