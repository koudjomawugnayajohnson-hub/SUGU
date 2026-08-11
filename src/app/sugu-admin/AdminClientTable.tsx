'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react'

type Tenant = {
  id: string
  name: string
  contact_email: string
  phone: string
  status: string
  plan?: string
  created_at: string
}

export default function AdminClientTable({ initialTenants }: { initialTenants: Tenant[] }) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    if (!window.confirm(`Confirmez-vous le passage au statut ${newStatus} ?`)) return

    setIsUpdating(tenantId)

    try {
      const res = await fetch('/api/admin/update-tenant-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, status: newStatus })
      })

      const data = await res.json()

      if (res.ok) {
        // Mettre à jour l'état local
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, status: newStatus } : t))
      } else {
        alert(data.error || "Une erreur est survenue")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur de connexion.")
    } finally {
      setIsUpdating(null)
    }
  }

  const handlePlanChange = async (tenantId: string, newPlan: string) => {
    if (!window.confirm(`Confirmez-vous le passage au plan ${newPlan.toUpperCase()} ?`)) return

    setIsUpdating(tenantId)

    try {
      const res = await fetch('/api/admin/update-tenant-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, plan: newPlan })
      })

      const data = await res.json()

      if (res.ok) {
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, plan: newPlan } : t))
      } else {
        alert(data.error || "Une erreur est survenue")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur de connexion.")
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT le compte "${tenantName}" ? Cette action est irréversible et supprimera toutes les données associées.`)) return

    setIsUpdating(tenantId)

    try {
      const res = await fetch('/api/admin/delete-tenant', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId })
      })

      const data = await res.json()

      if (res.ok) {
        setTenants(prev => prev.filter(t => t.id !== tenantId))
      } else {
        alert(data.error || "Une erreur est survenue lors de la suppression.")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur de connexion.")
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} /> Actif</span>
      case 'SUSPENDED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} /> Suspendu</span>
      case 'TRIAL':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><RefreshCw size={12} /> Essai</span>
      case 'EXPIRED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"><XCircle size={12} /> Expiré</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>
    }
  }

  if (tenants.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Aucun espace de travail (tenant) trouvé.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white border-b border-gray-100 text-gray-500 text-sm">
            <th className="px-6 py-4 font-medium">Boutique</th>
            <th className="px-6 py-4 font-medium">Contact</th>
            <th className="px-6 py-4 font-medium">Création</th>
            <th className="px-6 py-4 font-medium">Plan</th>
            <th className="px-6 py-4 font-medium">Statut</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {tenants.map(tenant => (
            <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-gray-900">{tenant.name || 'Boutique sans nom'}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">{tenant.id}</p>
              </td>
              <td className="px-6 py-4 text-sm">
                <p className="text-gray-900 font-medium">{tenant.contact_email || 'Non défini'}</p>
                <p className="text-gray-500">{tenant.phone}</p>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
              </td>
              <td className="px-6 py-4">
                {tenant.plan === 'pro' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                    PRO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                    FREE
                  </span>
                )}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(tenant.status)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {isUpdating === tenant.id ? (
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                  ) : (
                    <>
                      {tenant.plan !== 'pro' ? (
                        <button
                          onClick={() => handlePlanChange(tenant.id, 'pro')}
                          className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          Passer en PRO
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePlanChange(tenant.id, 'free')}
                          className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                        >
                          Passer en FREE
                        </button>
                      )}
                      <select 
                        value={tenant.status}
                        onChange={(e) => handleStatusChange(tenant.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-medium cursor-pointer"
                      >
                        <option value="ACTIVE">Activer (Active)</option>
                        <option value="SUSPENDED">Bloquer (Suspended)</option>
                        <option value="TRIAL">Essai (Trial)</option>
                        <option value="EXPIRED">Expirer (Expired)</option>
                      </select>
                      <button
                        onClick={() => handleDeleteTenant(tenant.id, tenant.name || 'Boutique sans nom')}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer ce compte"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
