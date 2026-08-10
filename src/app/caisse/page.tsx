'use client'

import { useState, useEffect } from 'react'
import { Search, Receipt, Trash2, Trash, ArrowLeft, Loader2, Printer, Lock, Delete, CheckCircle2, User, X, LogOut, Wallet } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

// Définition des types pour une meilleure structure
type Product = {
  id: string | number
  name: string
  price: number
  acronym?: string
  color?: string
  stock_quantity?: number
  track_stock?: boolean
}

type CartItem = {
  product: Product
  quantity: number
}

type ShopSettings = {
  name: string
  address: string
  phone: string
  tax_rate: number
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
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // État du panier, hydratation et encaissement
  const [cart, setCart] = useState<CartItem[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  
  // État du dernier reçu pour impression
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)
  
  // =========================================
  // GESTION DES DÉPENSES
  // =========================================
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false)

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseAmount || !expenseDescription) return
    setIsSubmittingExpense(true)
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(expenseAmount),
          description: expenseDescription,
          cashierName
        })
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement')
      }
      
      alert("✅ Dépense enregistrée avec succès !")
      setShowExpenseModal(false)
      setExpenseAmount('')
      setExpenseDescription('')
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue"
      alert(`❌ ${message}`)
    } finally {
      setIsSubmittingExpense(false)
    }
  }
  
  // =========================================
  // VERROUILLAGE DE LA CAISSE (PIN)
  // =========================================
  const [isLocked, setIsLocked] = useState(true)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [cashierName, setCashierName] = useState<string | null>(null)
  const [cashierRole, setCashierRole] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'ESPECES' | 'ORANGE_MONEY'>('ESPECES')

  // =========================================
  // DÉROGATION MANAGÉRIALE (OVERRIDE)
  // =========================================
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [overridePin, setOverridePin] = useState('')
  const [isOverrideGranted, setIsOverrideGranted] = useState(false)
  const [isOverrideVerifying, setIsOverrideVerifying] = useState(false)
  const [overrideError, setOverrideError] = useState(false)

  const handleOverrideInput = (num: string) => {
    if (overridePin.length < 4) {
      setOverridePin(prev => prev + num)
      setOverrideError(false)
    }
  }

  const handleOverrideClear = () => {
    setOverridePin('')
    setOverrideError(false)
  }

  const handleOverrideSubmit = async () => {
    if (overridePin.length !== 4) return
    setIsOverrideVerifying(true)
    
    try {
      const response = await fetch('/api/verify-master-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: overridePin })
      })
      const data = await response.json()

      if (data.success) {
        setIsOverrideGranted(true)
        setShowOverrideModal(false)
        setOverridePin('')
        // On relance la fonction de checkout automatiquement
        handleCheckout()
      } else {
        setOverrideError(true)
        setTimeout(() => {
          setOverridePin('')
          setOverrideError(false)
        }, 500)
      }
    } catch (err) {
      setOverrideError(true)
      setTimeout(() => {
        setOverridePin('')
        setOverrideError(false)
      }, 500)
    } finally {
      setIsOverrideVerifying(false)
    }
  }
  const handlePinInput = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num)
      setPinError(false)
    }
  }

  const handlePinClear = () => {
    setPin('')
    setPinError(false)
  }

  const handlePinSubmit = async () => {
    if (pin.length !== 4) return
    
    setIsVerifying(true)
    
    try {
      const response = await fetch('/api/cashiers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      })
      const data = await response.json()
        
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Code PIN invalide')
      }
      
      // Succès
      setCashierName(data.cashier.name)
      setCashierRole(data.cashier.role)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sugu_cashier_role', data.cashier.role)
      }
      setIsLocked(false)
      setPin('')
    } catch (err) {
      // Échec
      setPinError(true)
      setTimeout(() => {
        setPin('')
        setPinError(false)
      }, 500)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCashierLogout = () => {
    setIsLocked(true)
    setCashierName(null)
    setCashierRole(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sugu_cashier_role')
    }
  }
  
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

        // Charger les paramètres du magasin via l'API
        const resSettings = await fetch('/api/settings')
        if (resSettings.ok) {
          const { settings } = await resSettings.json()
          if (settings) {
            setShopSettings({
              name: settings.name || 'SUGU',
              address: settings.address || '',
              phone: settings.phone || '',
              tax_rate: settings.tax_rate ?? 18
            })
          }
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
  // VÉRIFICATION DE L'AUTHENTIFICATION
  // =========================================
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  // =========================================
  // LOGIQUE D'ENCAISSEMENT (CHECKOUT)
  // =========================================
  
  // Calculs en temps réel
  const taxRate = shopSettings?.tax_rate ?? 18
  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
  const tax = subtotal * (taxRate / 100) 
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (cart.length === 0) return

    // Vérifier l'authentification avant l'encaissement
    if (!isAuthenticated) {
      alert("⚠️ Vous devez être connecté pour encaisser. Redirection vers la page de connexion...")
      window.location.href = '/login'
      return
    }

    // Vérification du stock
    const hasStockConflict = cart.some(item => 
      item.product.track_stock !== false && item.quantity > (item.product.stock_quantity || 0)
    )

    if (hasStockConflict && !isOverrideGranted) {
      alert("⚠️ Stock insuffisant pour un ou plusieurs articles. Une dérogation est requise.")
      setShowOverrideModal(true)
      return
    }

    setIsCheckingOut(true)

    try {
      // Appel au serveur — le tenant_id est extrait du JWT côté serveur
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart: cart.map(item => ({
            product: { id: item.product.id, name: item.product.name, price: item.product.price },
            quantity: item.quantity
          })),
          total,
          paymentMethod,
          cashierName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur inconnue lors de l'encaissement.")
      }

      // Succès : Nettoyage et préparation de l'impression
      setLastReceipt({
        items: [...cart],
        subtotal,
        tax,
        total,
        date: new Date(),
        orderId: data.orderId
      })

      // Mettre à jour le stock localement pour éviter de recharger la page
      setProducts(prevProducts => prevProducts.map(p => {
        const cartItem = cart.find(item => item.product.id === p.id)
        if (cartItem && p.track_stock !== false) {
          return { ...p, stock_quantity: Math.max(0, (p.stock_quantity || 0) - cartItem.quantity) }
        }
        return p
      }))

      setCart([])
      setIsOverrideGranted(false) // Réinitialiser la dérogation pour la prochaine vente
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sugu_offline_cart')
      }
      
      // Attendre un instant pour que React affiche le ticket caché, puis lancer l'impression
      setTimeout(() => {
        window.print()
      }, 50)

    } catch (error) {
      console.error("Erreur lors de l'encaissement :", error)
      const message = error instanceof Error ? error.message : "Erreur inconnue"
      alert(`❌ ${message}`)
    } finally {
      setIsCheckingOut(false)
    }
  }


  // On évite les disparités d'hydratation (Hydration Mismatch)
  if (!isMounted) {
    return <div className="h-screen bg-gray-50 flex items-center justify-center font-sans text-gray-500">Chargement de la caisse...</div>
  }

  // =========================================
  // ÉCRAN DE VERROUILLAGE (PIN)
  // =========================================
  if (isLocked) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/20 transition-all">
          <div className="bg-blue-500 p-4 rounded-full mb-6 shadow-lg shadow-blue-500/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Caisse Verrouillée</h1>
          <p className="text-slate-300 text-sm mb-8">Saisissez votre code PIN pour y accéder</p>
          
          {/* Affichage du code PIN (Points) */}
          <div className="flex gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length 
                    ? (pinError ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500 shadow-md shadow-blue-500/50') 
                    : (pinError ? 'border-red-500' : 'border-slate-500')
                }`}
              />
            ))}
          </div>
          <div className="h-6 mb-6 -mt-6 flex items-center justify-center w-full">
            {pinError && <p className="text-red-400 font-medium text-sm animate-pulse">Code PIN incorrect</p>}
          </div>

          {/* Pavé Numérique */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePinInput(num.toString())}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-3xl font-semibold transition-colors flex items-center justify-center shadow-sm"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handlePinClear}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-red-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              <Delete className="w-8 h-8" />
            </button>
            <button
              onClick={() => handlePinInput('0')}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-3xl font-semibold transition-colors flex items-center justify-center shadow-sm"
            >
              0
            </button>
            <button
              onClick={handlePinSubmit}
              disabled={pin.length < 4 || isVerifying}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all ${
                pin.length === 4 && !isVerifying
                  ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-lg shadow-blue-600/40' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
              ) : (
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* =========================================
          MODALE DÉPENSE
          ========================================= */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white p-8 rounded-3xl shadow-2xl relative w-full max-w-md">
            <button 
              onClick={() => setShowExpenseModal(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Sortie de Caisse</h2>
            </div>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (F CFA)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-gray-900"
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la dépense</label>
                <input 
                  type="text" 
                  required
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none text-gray-900"
                  placeholder="Ex: Paiement livreur, achat eau..."
                />
              </div>
              <button 
                type="submit"
                disabled={isSubmittingExpense || !expenseAmount || !expenseDescription}
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSubmittingExpense ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enregistrer la Dépense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================
          MODALE DÉROGATION (OVERRIDE)
          ========================================= */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden">
          <div className="flex flex-col items-center bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl border border-white/10 relative">
            
            <button 
              onClick={() => { setShowOverrideModal(false); setOverridePin(''); setOverrideError(false); }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="bg-red-500 p-4 rounded-full mb-6 shadow-lg shadow-red-500/30">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">Dérogation requise</h2>
            <p className="text-slate-300 text-sm mb-8 text-center max-w-xs">Code Propriétaire (Master PIN) requis pour autoriser la vente hors stock.</p>
            
            {/* Affichage du code PIN */}
            <div className="flex gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 transition-all duration-200 ${
                    i < overridePin.length 
                      ? (overrideError ? 'bg-red-500 border-red-500' : 'bg-red-500 border-red-500 shadow-md shadow-red-500/50') 
                      : (overrideError ? 'border-red-500' : 'border-slate-500')
                  }`}
                />
              ))}
            </div>
            <div className="h-6 mb-6 -mt-6 flex items-center justify-center w-full">
              {overrideError && <p className="text-red-400 font-medium text-sm animate-pulse">Code invalide</p>}
            </div>

            {/* Pavé Numérique */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleOverrideInput(num.toString())}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-3xl font-semibold transition-colors flex items-center justify-center shadow-sm"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleOverrideClear}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-red-500/40 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Delete className="w-8 h-8" />
              </button>
              <button
                onClick={() => handleOverrideInput('0')}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-3xl font-semibold transition-colors flex items-center justify-center shadow-sm"
              >
                0
              </button>
              <button
                onClick={handleOverrideSubmit}
                disabled={overridePin.length < 4 || isOverrideVerifying}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all ${
                  overridePin.length === 4 && !isOverrideVerifying
                    ? 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-lg shadow-red-600/40' 
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
              >
                {isOverrideVerifying ? (
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          APPLICATION (Masquée pendant l'impression)
          ========================================= */}
      <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden font-sans print:hidden">
        
        {/* COLONNE GAUCHE : CATALOGUE (70%) */}
        <div className="flex flex-col w-full lg:w-[70%] h-[50vh] lg:h-full border-b lg:border-b-0 lg:border-r border-gray-200">
          
          {/* Topbar / Barre de recherche */}
          <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200 shadow-sm z-10 shrink-0">
            {cashierRole === 'ADMIN' ? (
              <Link href="/dashboard" className="p-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors" title="Retour au Dashboard">
                <ArrowLeft className="h-6 w-6" />
              </Link>
            ) : (
              <button onClick={handleCashierLogout} className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors" title="Déconnexion de la caisse">
                <LogOut className="h-6 w-6" />
              </button>
            )}

            <button onClick={() => setShowExpenseModal(true)} className="p-3 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-colors" title="Sortie de Caisse (Dépense)">
              <Wallet className="h-6 w-6" />
            </button>
            
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
            
            {/* Infos Caissier Connecté */}
            {cashierName && (
              <div className="hidden sm:flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-medium text-sm">
                <User className="w-4 h-4 mr-2 text-slate-500" />
                Caissier : {cashierName}
              </div>
            )}
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
              <button 
                onClick={() => window.print()}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                title="Ouvrir le tiroir caisse"
              >
                Ouvrir Tiroir
              </button>
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
                <span>TVA ({taxRate}%)</span>
                <span className="font-medium">{tax} F</span>
              </div>
              <div className="flex justify-between text-gray-900 text-2xl font-black pt-2 border-t border-gray-100 mt-2">
                <span>Total</span>
                <span>{total} F CFA</span>
              </div>
            </div>
            
            <div className="pt-2 space-y-3">
              {/* Sélecteur de moyen de paiement */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setPaymentMethod('ESPECES')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    paymentMethod === 'ESPECES' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Espèces
                </button>
                <button
                  onClick={() => setPaymentMethod('ORANGE_MONEY')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                    paymentMethod === 'ORANGE_MONEY' 
                      ? 'bg-[#FF7900] text-white shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Orange Money
                </button>
              </div>

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
            <h1 className="font-bold text-2xl mb-1 uppercase tracking-wider">{shopSettings?.name || 'SUGU'}</h1>
            {shopSettings?.address && <p className="text-xs">{shopSettings.address}</p>}
            {shopSettings?.phone && <p className="text-xs">{shopSettings.phone}</p>}
            {!shopSettings?.address && !shopSettings?.phone && <p className="text-xs uppercase">Point de Vente</p>}
            <div className="border-b border-dashed border-black pb-2 mb-2 mt-3 text-xs">
              <p>Le {lastReceipt.date.toLocaleDateString('fr-FR')} à {lastReceipt.date.toLocaleTimeString('fr-FR')}</p>
              <p className="font-bold mt-1">Ticket #{lastReceipt.orderId.split('-')[0].toUpperCase()}</p>
              <p className="font-bold mt-1">Caissier : {cashierName}</p>
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
              <span>TVA ({taxRate}%)</span>
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
