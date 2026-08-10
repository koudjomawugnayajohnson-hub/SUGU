import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié.' },
        { status: 401 }
      )
    }

    // 2. Vérifier si l'utilisateur est un super-admin
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: admin, error: adminError } = await supabaseAdmin
      .from('saas_admins')
      .select('email')
      .eq('email', user.email)
      .single()

    if ((adminError || !admin) && user.email !== 'koudjomawugnayajohnson@gmail.com') {
      return NextResponse.json(
        { error: 'Accès refusé. Droits administrateur requis.' },
        { status: 403 }
      )
    }

    // 3. Parser le body (tenant_id et status)
    const body = await request.json()
    const { tenant_id, status } = body

    if (!tenant_id || !status) {
      return NextResponse.json(
        { error: 'Données manquantes (tenant_id ou status).' },
        { status: 400 }
      )
    }

    // 4. Mettre à jour le statut du tenant
    const { error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({ status })
      .eq('id', tenant_id)

    if (updateError) {
      console.error('Erreur de mise à jour:', updateError)
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Le statut du tenant a été mis à jour avec succès en ${status}.`
    })

  } catch (error) {
    console.error('Erreur serveur update-tenant-status:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
