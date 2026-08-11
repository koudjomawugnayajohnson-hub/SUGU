import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'
import SuspendedScreen from '@/components/dashboard/SuspendedScreen'

export default async function DashboardLayout({
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
      .select('status, trial_ends_at')
      .eq('id', tenantId)
      .single()
      
    if (tenant) {
      const isTrialExpired = tenant.status === 'TRIAL' && new Date() > new Date(tenant.trial_ends_at);
      
      if (isTrialExpired) {
        return (
          <SuspendedScreen 
            title="Essai Terminé" 
            message="Votre période d'essai de 14 jours est terminée. Veuillez passer au Plan Pro pour continuer à utiliser SUGU." 
          />
        )
      }

      if (tenant.status === 'SUSPENDED' || tenant.status === 'EXPIRED') {
        return <SuspendedScreen />
      }
    }
  }

  // Rendu de l'interface protégée (Sidebar + Header)
  return <DashboardShell>{children}</DashboardShell>
}
