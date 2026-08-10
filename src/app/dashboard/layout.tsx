import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardShell from '@/components/dashboard/DashboardShell'

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

  // Rendu de l'interface protégée (Sidebar + Header)
  return <DashboardShell>{children}</DashboardShell>
}
