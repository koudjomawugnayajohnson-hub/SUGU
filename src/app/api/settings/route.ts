import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .select('name, address, phone, tax_rate')
      .eq('id', tenantId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: tenant })
  } catch (err) {
    console.error("API GET Settings Error:", err)
    return NextResponse.json({ error: "Erreur Serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const tenantId = user.app_metadata?.tenant_id

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 400 })
    }

    const body = await request.json()
    const { name, address, phone, tax_rate } = body

    const supabaseAdmin = createAdminClient()
    const { error } = await supabaseAdmin
      .from('tenants')
      .update({
        name,
        address,
        phone,
        tax_rate: Number(tax_rate)
      })
      .eq('id', tenantId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("API POST Settings Error:", err)
    return NextResponse.json({ error: "Erreur Serveur" }, { status: 500 })
  }
}
