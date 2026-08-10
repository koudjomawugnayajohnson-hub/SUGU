'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Plus, Trash2, UserPlus, Users, Search } from 'lucide-react'

type Cashier = {
  id: string
  name: string
  pin_code: string
  created_at: string
}

export default function CashiersPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const supabase = createClient()

  const fetchCashiers = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('cashiers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCashiers(data || [])
    } catch (err: any) {
      console.error('Erreur de chargement:', err)
      setError('Impossible de charger les caissiers.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCashiers()
  }, [])

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Le nom est obligatoire.')
      return
    }

    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      setError('Le code PIN doit contenir entre 4 et 6 chiffres.')
      return
    }

    setIsAdding(true)
    try {
      // 1. Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) throw new Error("Vous n'êtes pas connecté.")

      // 2. Chercher le tenant_id de cet utilisateur dans la table users (par ID, plus fiable que l'email)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error("Erreur SELECT users:", userError);
        throw new Error(`Erreur DB: ${userError.message}`);
      }
      if (!userData?.tenant_id) {
        throw new Error("Impossible de trouver votre identifiant de locataire (tenant_id).");
      }

      const tenantId = userData.tenant_id

      // 3. Insérer le caissier en précisant explicitement le tenant_id
      const { error: insertError } = await supabase
        .from('cashiers')
        .insert([
          {
            tenant_id: tenantId,
            name: name.trim(),
            pin_code: pin
          }
        ])

      if (insertError) throw insertError

      // Succès
      setName('')
      setPin('')
      fetchCashiers()
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout:', err)
      setError(err.message || 'Une erreur est survenue lors de l\'ajout.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteCashier = async (id: string, cashierName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir révoquer l'accès à "${cashierName}" ?`)) {
      return
    }

    setIsDeleting(id)
    try {
      const { error } = await supabase
        .from('cashiers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCashiers(cashiers.filter(c => c.id !== id))
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      alert('Impossible de supprimer ce caissier.')
    } finally {
      setIsDeleting(null)
    }
  }

  const filteredCashiers = cashiers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          Équipe & Caissiers
        </h1>
        <p className="text-slate-500 mt-2">Gérez les accès à la caisse et attribuez des codes PIN à vos employés.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE: Formulaire d'ajout */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <UserPlus className="w-5 h-5 text-blue-500" />
              Nouveau Caissier
            </h2>

            <form onSubmit={handleAddCashier} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Vendeur 2"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Code PIN (4 à 6 chiffres)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Ex: 8520"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 text-slate-900 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono text-lg tracking-widest"
                  required
                />
                <p className="text-xs text-slate-400 mt-2">Ce code servira à déverrouiller la caisse.</p>
              </div>

              <button
                type="submit"
                disabled={isAdding}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                Créer l'accès
              </button>
            </form>
          </div>
        </div>

        {/* COLONNE DROITE: Liste des caissiers */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-800">Membres du personnel ({cashiers.length})</h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border-slate-200 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-semibold">Nom</th>
                    <th className="px-6 py-4 font-semibold">Code PIN</th>
                    <th className="px-6 py-4 font-semibold">Ajouté le</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                        Chargement des employés...
                      </td>
                    </tr>
                  ) : filteredCashiers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                        Aucun caissier trouvé.
                      </td>
                    </tr>
                  ) : (
                    filteredCashiers.map((cashier) => (
                      <tr key={cashier.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                              {cashier.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800">{cashier.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-mono font-medium bg-slate-100 text-slate-800">
                            {cashier.pin_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(cashier.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteCashier(cashier.id, cashier.name)}
                            disabled={isDeleting === cashier.id}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Révoquer l'accès"
                          >
                            {isDeleting === cashier.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
