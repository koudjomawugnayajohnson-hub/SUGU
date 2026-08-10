import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate — getUser() is the secure method (validates with Supabase Auth server)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié. Veuillez vous reconnecter.' },
        { status: 401 }
      )
    }

    // We use a secure Postgres RPC function to get the tenant_id based on the user's email.
    // This bypasses any RLS issues and doesn't rely on the JWT hook.
    const { data: tenantId, error: tenantError } = await supabase.rpc('get_my_tenant_id')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Aucun tenant associé à votre compte. Contactez l\'administrateur.' },
        { status: 403 }
      )
    }

    // 3. Parse the request body
    const body = await request.json()
    const { cart, total, paymentMethod, cashierName } = body

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: 'Le panier est vide.' },
        { status: 400 }
      )
    }

    if (typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { error: 'Le montant total est invalide.' },
        { status: 400 }
      )
    }

    // 4. Generate order ID on the server
    const orderId = crypto.randomUUID()

    // 5. Insert the order
    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        tenant_id: tenantId,
        total_amount: total,
        payment_method: paymentMethod || 'CASH',
        status: 'COMPLETED',
        cashier_name: cashierName || 'Inconnu'
      })

    if (orderError) {
      console.error('Erreur insertion commande:', orderError)
      return NextResponse.json(
        { error: `Erreur lors de la création de la commande: ${orderError.message}` },
        { status: 500 }
      )
    }

    // 6. Insert order items
    const orderItems = cart.map((item: { product: { id: string; name: string; price: number }; quantity: number }) => ({
      tenant_id: tenantId,
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
      subtotal: item.product.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Erreur insertion lignes:', itemsError)
      // Attempt to clean up the order if items fail
      await supabase.from('orders').delete().eq('id', orderId)
      return NextResponse.json(
        { error: `Erreur lors de l'ajout des articles: ${itemsError.message}` },
        { status: 500 }
      )
    }

    // 7. Success
    return NextResponse.json({
      success: true,
      orderId,
      message: 'Encaissement réussi !'
    })

  } catch (error) {
    console.error('Erreur serveur checkout:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
}
