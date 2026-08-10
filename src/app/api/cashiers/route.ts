import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { name, pinCode } = await request.json()

    if (!name || !pinCode) {
      return NextResponse.json(
        { error: 'Le nom et le code PIN sont obligatoires.' },
        { status: 400 }
      )
    }

    // 1. Identifier l'utilisateur connecté de manière sécurisée
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // 2. Récupérer le tenant_id de l'utilisateur (en consultant la table users ou via RPC)
    let tenantId = null;
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!userError && userData?.tenant_id) {
      tenantId = userData.tenant_id
    } else {
      const { data: rpcTenantId, error: rpcError } = await supabase.rpc('get_my_tenant_id')
      if (!rpcError && rpcTenantId) {
        tenantId = rpcTenantId
      }
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Impossible de récupérer l\'identifiant de la boutique.' },
        { status: 403 }
      )
    }

    // 3. Effectuer l'insertion dans la table cashiers (contournement RLS)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: newCashier, error: insertError } = await supabaseAdmin
      .from('cashiers')
      .insert([
        {
          tenant_id: tenantId,
          name: name.trim(),
          pin_code: pinCode
        }
      ])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ success: true, data: newCashier })

  } catch (error: any) {
    console.error('Erreur dans l\'API cashiers:', error)
    return NextResponse.json(
      { error: error.message || 'Une erreur interne est survenue.' },
      { status: 500 }
    )
  }
}
