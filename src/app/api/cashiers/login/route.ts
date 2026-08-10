import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { pin } = await request.json()

    if (!pin) {
      return NextResponse.json({ success: false, error: 'PIN requis' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Identifier le propriétaire connecté
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 })
    }

    // 2. Récupérer le tenant_id
    let tenantId = null;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userError && userData?.tenant_id) {
      tenantId = userData.tenant_id
    } else {
      const { data: rpcTenantId } = await supabase.rpc('get_my_tenant_id')
      if (rpcTenantId) tenantId = rpcTenantId
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Impossible de récupérer la boutique' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 3. Vérifier le PIN dans la table cashiers
    const { data: cashierData, error: cashierError } = await supabaseAdmin
      .from('cashiers')
      .select('name, role')
      .eq('tenant_id', tenantId)
      .eq('pin_code', pin)
      .single()

    if (cashierError || !cashierData) {
      return NextResponse.json({ success: false, error: 'PIN invalide' }, { status: 403 })
    }

    return NextResponse.json({ 
      success: true, 
      cashier: { 
        name: cashierData.name, 
        role: cashierData.role 
      } 
    })

  } catch (error: unknown) {
    console.error('Erreur cashiers login:', error)
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 })
  }
}
