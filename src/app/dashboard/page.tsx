'use client'

import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, AlertCircle, Package, Clock, CreditCard, User, Loader2, Activity, ArrowDownRight, Wallet } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

type Order = {
  id: string
  created_at: string
  total_amount: number
  cashier_name: string
  payment_method: string
}

type Product = {
  id: string
  name: string
  stock_quantity: number
}

export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [stockAlerts, setStockAlerts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayISO = today.toISOString()

      try {
        // 1. Fetch Today's Orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('id, created_at, total_amount, cashier_name, payment_method')
          .gte('created_at', todayISO)
          .order('created_at', { ascending: false })

        if (!ordersError && ordersData) {
          const revenue = ordersData.reduce((acc, order) => acc + Number(order.total_amount), 0)
          setTotalRevenue(revenue)
          setTotalOrders(ordersData.length)
          setRecentOrders(ordersData.slice(0, 10))
        }

        // 2. Fetch Today's Expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .gte('created_at', todayISO)

        if (!expensesError && expensesData) {
          const expensesSum = expensesData.reduce((acc, exp) => acc + Number(exp.amount), 0)
          setTotalExpenses(expensesSum)
        }

        // 3. Fetch Stock Alerts
        const { data: stockData, error: stockError } = await supabase
          .from('products')
          .select('id, name, stock_quantity')
          .eq('track_stock', true)
          .lte('stock_quantity', 5)
          .order('stock_quantity', { ascending: true })

        if (!stockError && stockData) {
          setStockAlerts(stockData)
        }

      } catch (err) {
        console.error("Erreur inattendue:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + " F CFA"
  }

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatPaymentMethod = (method: string) => {
    if (method === 'CASH') return 'Espèces'
    if (method === 'MOBILE_MONEY') return 'Mobile Money'
    return method
  }

  const netBalance = totalRevenue - totalExpenses

  return (
    <div className="p-8 w-full bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-500 mt-1">Vos performances d'aujourd'hui en un coup d'œil.</p>
      </div>

      {/* SECTION 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Carte 1 : Ventes Brutes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-200">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ventes Brutes</p>
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-blue-500 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            )}
          </div>
        </div>

        {/* Carte 2 : Dépenses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-200">
          <div className="p-4 bg-red-50 text-red-600 rounded-xl">
            <ArrowDownRight size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Dépenses (Sorties)</p>
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-red-500 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            )}
          </div>
        </div>

        {/* Carte 3 : Solde Net en Caisse */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-200">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Solde Net Caisse</p>
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(netBalance)}</p>
            )}
          </div>
        </div>

        {/* Carte 4 : Ventes du jour (Nombre) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-200">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl">
            <ShoppingCart size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Nombre de Tickets</p>
            {isLoading ? (
              <Loader2 className="h-7 w-7 animate-spin text-purple-500 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SECTION 2 : Flux d'Activité */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <Activity className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900">Dernières Ventes</h2>
          </div>
          <div className="p-0 flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                <p>Aucune vente enregistrée aujourd'hui.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-sm">
                      <th className="px-6 py-3 font-medium">Heure</th>
                      <th className="px-6 py-3 font-medium">Caissier</th>
                      <th className="px-6 py-3 font-medium">Montant</th>
                      <th className="px-6 py-3 font-medium">Paiement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {formatTime(order.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <User className="h-4 w-4 text-gray-400" />
                            {order.cashier_name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <span className={`text-xs font-medium px-2 py-1 rounded-md ${order.payment_method === 'MOBILE_MONEY' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                              {formatPaymentMethod(order.payment_method)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3 : Alertes Stock */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-red-50 bg-red-50/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Alertes Stock</h2>
            </div>
            {stockAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {stockAlerts.length}
              </span>
            )}
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-red-200" />
              </div>
            ) : stockAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 p-6 text-center">
                <Package className="h-10 w-10 text-gray-200 mb-3" />
                <p>Aucune alerte de stock.</p>
                <p className="text-sm mt-1">Tous vos produits sont bien approvisionnés.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-4">
                {stockAlerts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-white border border-red-100 rounded-xl shadow-sm hover:border-red-200 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{product.name}</span>
                      <span className="text-sm text-red-500 font-medium">Rupture imminente</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-red-600 leading-none">{product.stock_quantity}</span>
                      <span className="text-xs text-red-400 font-medium">restants</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
