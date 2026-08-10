import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Validate auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié. Veuillez vous reconnecter.' }, { status: 401 })
    }

    // 2. Get tenant ID using secure RPC
    const { data: tenantId } = await supabase.rpc('get_my_tenant_id')
    if (!tenantId) {
      return NextResponse.json({ error: "Aucun tenant associé à votre compte." }, { status: 403 })
    }

    // 3. Parse Body
    const body = await request.json()
    const { amount, description, cashierName } = body

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0 || !description) {
      return NextResponse.json({ error: "Montant ou motif invalide." }, { status: 400 })
    }

    // 4. Insert with Admin Client to bypass RLS for cashiers
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: insertError } = await supabaseAdmin
      .from('expenses')
      .insert({
        tenant_id: tenantId,
        amount: Number(amount),
        description: description,
        cashier_name: cashierName || 'Inconnu'
      })

    if (insertError) {
      console.error('Erreur insertion dépense:', insertError)
      return NextResponse.json({ error: `Erreur d'insertion: ${insertError.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Dépense enregistrée avec succès.' })

  } catch (error) {
    console.error('Erreur serveur expenses:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 })
  }
}
