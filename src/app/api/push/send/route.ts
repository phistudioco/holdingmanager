import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@phistudios.com'

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

// Create Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type PushPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  type?: string
  entite_type?: string
  entite_id?: number
}

export async function POST(request: NextRequest) {
  try {
    // Verify VAPID keys are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'VAPID keys not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { user_id, user_ids, payload } = body as {
      user_id?: string
      user_ids?: string[]
      payload: PushPayload
    }

    // Determine target users
    const targetUserIds = user_ids || (user_id ? [user_id] : [])

    if (targetUserIds.length === 0) {
      // If no specific users, send to all subscribed users
      const { data: subscriptions, error: fetchError } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')

      if (fetchError) {
        console.error('Erreur fetch subscriptions:', fetchError)
        return NextResponse.json(
          { error: 'Erreur récupération abonnements' },
          { status: 500 }
        )
      }

      const results = await sendToSubscriptions(subscriptions || [], payload)
      return NextResponse.json({ success: true, results })
    }

    // Fetch subscriptions for specific users
    const { data: subscriptions, error: fetchError } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*')
      .in('user_id', targetUserIds)

    if (fetchError) {
      console.error('Erreur fetch subscriptions:', fetchError)
      return NextResponse.json(
        { error: 'Erreur récupération abonnements' },
        { status: 500 }
      )
    }

    const results = await sendToSubscriptions(subscriptions || [], payload)
    return NextResponse.json({ success: true, results })

  } catch (error) {
    console.error('Erreur envoi push:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

async function sendToSubscriptions(
  subscriptions: Array<{
    user_id: string
    endpoint: string
    p256dh: string
    auth: string
  }>,
  payload: PushPayload
) {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const sub of subscriptions) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      }

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/badge-72x72.png',
          tag: payload.tag || 'notification',
          data: {
            url: payload.url,
            type: payload.type,
            entite_type: payload.entite_type,
            entite_id: payload.entite_id,
          },
        })
      )

      results.sent++
    } catch (error: unknown) {
      results.failed++

      // Handle expired subscriptions
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const webPushError = error as { statusCode: number }
        if (webPushError.statusCode === 410) {
          // Subscription expired, remove from database
          await supabaseAdmin
            .from('push_subscriptions')
            .delete()
            .eq('user_id', sub.user_id)

          results.errors.push(`Subscription expirée pour user ${sub.user_id}, supprimée`)
        } else {
          results.errors.push(`Erreur ${webPushError.statusCode} pour user ${sub.user_id}`)
        }
      } else {
        results.errors.push(`Erreur inconnue pour user ${sub.user_id}`)
      }
    }
  }

  return results
}
