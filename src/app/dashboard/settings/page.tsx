'use client'

import { useEffect, useState } from "react"
import { Save, Store, MapPin, Phone, Percent, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export default function SettingsPage() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [taxRate, setTaxRate] = useState('18')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (!response.ok) {
          throw new Error('Erreur de récupération des paramètres')
        }
        const { settings } = await response.json()

        if (settings) {
          setName(settings.name || '')
          setAddress(settings.address || '')
          setPhone(settings.phone || '')
          if (settings.tax_rate !== null && settings.tax_rate !== undefined) {
            setTaxRate(settings.tax_rate.toString())
          }
        }
      } catch (err) {
        console.error("Erreur inattendue:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          address,
          phone,
          tax_rate: taxRate
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      alert("✅ Paramètres enregistrés avec succès !")
    } catch (err) {
      console.error(err)
      alert("❌ Erreur lors de la sauvegarde des paramètres.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-8 w-full bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-8 w-full bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Paramètres de la Boutique</h1>
        <p className="text-gray-500 mt-1">Gérez les informations qui apparaîtront sur vos tickets de caisse.</p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Informations Générales</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nom de la boutique */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Store className="w-4 h-4 text-gray-400" />
              Nom de la Boutique
            </label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white"
              placeholder="Ex: Superette ABC"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              Adresse
            </label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white"
              placeholder="Ex: 123 Rue du Commerce, Ville"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                Téléphone
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white"
                placeholder="Ex: +225 0102030405"
              />
            </div>

            {/* Taux de TVA */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-gray-400" />
                Taux de TVA (%)
              </label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 bg-gray-50 focus:bg-white"
                placeholder="Ex: 18"
              />
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end">
            <button 
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
