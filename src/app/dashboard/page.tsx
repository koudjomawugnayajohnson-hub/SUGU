'use client'

import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Package, Activity, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('total_amount, created_at');

        if (error) {
          console.error("Erreur lors de la récupération des commandes:", error);
          return;
        }

        if (data) {
          // 1. Calcul du chiffre d'affaires total
          const revenue = data.reduce((acc, order) => acc + Number(order.total_amount), 0);
          setTotalRevenue(revenue);
          
          // 2. Nombre total de commandes
          setTotalOrders(data.length);
        }
      } catch (err) {
        console.error("Erreur inattendue:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fonction de formatage en F CFA
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + " F CFA";
  };

  return (
    <div className="p-8 w-full bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tour de Contrôle</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Carte 1 : Chiffre d'Affaires */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-800 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Chiffre d'Affaires</p>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            )}
          </div>
        </div>

        {/* Carte 2 : Ventes du jour */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <ShoppingCart size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Ventes du jour</p>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-green-500 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            )}
          </div>
        </div>

        {/* Carte 3 : Produits en Alerte */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Produits en Alerte</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>

        {/* Carte 4 : Licence SaaS */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Licence SaaS</p>
            <p className="text-2xl font-bold text-gray-900">Essai (14j)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
