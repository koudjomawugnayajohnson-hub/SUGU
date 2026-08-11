import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function DELETE(request: Request) {
  try {
    const { tenant_id } = await request.json()

    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id manquant' }, { status: 400 })
    }

    // Vérifier que l'appelant est bien un super-admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Vérifier que l'utilisateur est un admin (table saas_admins ou email hardcodé)
    const { data: admin } = await supabaseAdmin
      .from('saas_admins')
      .select('email')
      .eq('email', user.email)
      .single()

    if (!admin && user.email?.toLowerCase() !== 'koudjomawugnayajohnson@gmail.com') {
      return NextResponse.json({ error: 'Accès refusé. Droits administrateur requis.' }, { status: 403 })
    }

    // 1. Récupérer tous les utilisateurs de ce tenant
    const { data: tenantUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('tenant_id', tenant_id)

    // 2. Supprimer les comptes Auth Supabase de ces utilisateurs
    if (tenantUsers && tenantUsers.length > 0) {
      for (const u of tenantUsers) {
        await supabaseAdmin.auth.admin.deleteUser(u.id)
      }
    }

    // 3. Supprimer le tenant (les cascades FK supprimeront les autres données)
    const { error: deleteError } = await supabaseAdmin
      .from('tenants')
      .delete()
      .eq('id', tenant_id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('Erreur API delete-tenant:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
