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

    // We use getSession() to read the JWT claims, because the Custom Access Token Hook
    // injects the tenant_id into the JWT, NOT into the auth.users database table.
    const { data: { session } } = await supabase.auth.getSession()
    const tenantId = session?.user?.app_metadata?.tenant_id

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Aucun tenant associé à votre compte. Contactez l\'administrateur.' },
        { status: 403 }
      )
    }

    // 3. Parse the request body
    const body = await request.json()
    const { cart, total, paymentMethod } = body

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
        status: 'COMPLETED'
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
