import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import SuspendedScreen from '@/components/dashboard/SuspendedScreen'

export default async function CaisseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Le dernier rempart : vérification stricte de la session côté serveur
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Vérification du statut de l'abonnement
  const { data: tenantId } = await supabase.rpc('get_my_tenant_id')
  
  if (tenantId) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('status')
      .eq('id', tenantId)
      .single()
      
    if (tenant?.status === 'SUSPENDED' || tenant?.status === 'EXPIRED') {
      return <SuspendedScreen />
    }
  }

  // Rendu de l'interface protégée (Caisse n'a pas de DashboardShell, juste les enfants)
  return <>{children}</>
}
