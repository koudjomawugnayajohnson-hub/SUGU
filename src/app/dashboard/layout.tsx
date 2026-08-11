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

  // Utilisation de l'Admin Client pour contourner RLS et garantir la lecture du statut
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Trouver le tenant_id de l'utilisateur
  const { data: dbUser } = await supabaseAdmin
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  
  if (dbUser?.tenant_id) {
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('status, trial_ends_at')
      .eq('id', dbUser.tenant_id)
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
