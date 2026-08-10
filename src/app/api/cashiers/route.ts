import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { name, pinCode, role } = await request.json()

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
          pin_code: pinCode,
          role: role || 'CASHIER'
        }
      ])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ success: true, data: newCashier })

  } catch (error: unknown) {
    console.error('Erreur dans l\'API cashiers:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Une erreur interne est survenue.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    let tenantId = null;
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (userData?.tenant_id) {
      tenantId = userData.tenant_id
    } else {
      const { data: rpcTenantId } = await supabase.rpc('get_my_tenant_id')
      if (rpcTenantId) tenantId = rpcTenantId
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Impossible de récupérer l\'identifiant de la boutique.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .from('cashiers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error: unknown) {
    console.error('Erreur GET cashiers:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur interne' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    let tenantId = null;
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (userData?.tenant_id) {
      tenantId = userData.tenant_id
    } else {
      const { data: rpcTenantId } = await supabase.rpc('get_my_tenant_id')
      if (rpcTenantId) tenantId = rpcTenantId
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Impossible de récupérer l\'identifiant de la boutique.' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
      .from('cashiers')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Erreur DELETE cashiers:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur interne' }, { status: 500 })
  }
}
