import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AdminClientTable from './AdminClientTable'
import { ShieldCheck } from 'lucide-react'

// Utilisation d'un composant Serveur pour sécuriser l'accès et récupérer les données
export default async function SuperAdminPage() {
  const supabase = await createClient()
  
  // 1. Vérifier l'utilisateur authentifié
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Vérifier si l'utilisateur est dans saas_admins
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: admin } = await supabaseAdmin
    .from('saas_admins')
    .select('email')
    .eq('email', user.email)
    .single()

  if (!admin && user.email?.toLowerCase() !== 'koudjomawugnayajohnson@gmail.com') {
    // S'il n'est pas admin et n'est pas l'email principal, on le renvoie
    redirect('/')
  }

  // 3. Récupérer tous les tenants pour affichage
  const { data: tenants, error } = await supabaseAdmin
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des tenants:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-gray-900 text-white rounded-xl shadow-sm">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel Super-Admin</h1>
            <p className="text-gray-500 mt-1">Gestion des abonnements et accès (SUGU)</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900">Liste des Espaces de Travail (Tenants)</h2>
          </div>
          
          <AdminClientTable initialTenants={tenants || []} />
          
        </div>
      </div>
    </div>
  )
}
