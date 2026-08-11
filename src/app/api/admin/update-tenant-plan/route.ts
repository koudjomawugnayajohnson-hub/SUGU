import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { tenant_id, plan } = await request.json()

    if (!tenant_id || !plan) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: admin, error: adminError } = await supabaseAdmin
      .from('saas_admins')
      .select('email')
      .eq('email', user.email)
      .single()

    if ((adminError || !admin) && user.email?.toLowerCase() !== 'koudjomawugnayajohnson@gmail.com') {
      return NextResponse.json(
        { error: 'Accès refusé. Droits administrateur requis.' },
        { status: 403 }
      )
    }

    const { error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({ plan })
      .eq('id', tenant_id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('Erreur API admin update-tenant-plan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
