import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerk_id;
        const type = session.metadata?.type;
        const tokens = parseInt(session.metadata?.tokens || "0");
        const planId = session.metadata?.plan_id;
        const planName = session.metadata?.plan_name;

        if (!clerkId) {
          console.error("Missing clerk_id in session metadata");
          break;
        }

        // Buscar perfil
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, credits_remaining")
          .eq("clerk_id", clerkId)
          .single();

        if (!profile) {
          console.error("Profile not found for:", clerkId);
          break;
        }

        if (type === "subscription") {
          // Assinatura - atualiza tier e adiciona tokens
          await supabaseAdmin
            .from("profiles")
            .update({
              subscription_tier: planId,
              subscription_status: "active",
              stripe_subscription_id: session.subscription as string,
              credits_remaining: (profile.credits_remaining || 0) + tokens,
            })
            .eq("clerk_id", clerkId);

          // Registrar no historico
          await supabaseAdmin.from("credits_history").insert({
            user_id: profile.id,
            amount: tokens,
            action_type: "subscription_purchase",
            description: `Assinatura ${planName} - ${tokens.toLocaleString("pt-BR")} tokens`,
            metadata: { plan_id: planId, session_id: session.id },
          });

          console.log(`✅ Assinatura ${planName} ativada: +${tokens.toLocaleString()} tokens para ${clerkId}`);
        } else if (type === "package") {
          // Pacote avulso - apenas adiciona tokens
          await supabaseAdmin
            .from("profiles")
            .update({
              credits_remaining: (profile.credits_remaining || 0) + tokens,
            })
            .eq("clerk_id", clerkId);

          // Registrar no historico
          await supabaseAdmin.from("credits_history").insert({
            user_id: profile.id,
            amount: tokens,
            action_type: "package_purchase",
            description: `Pacote ${planName} - ${tokens.toLocaleString("pt-BR")} tokens`,
            metadata: { package_id: planId, session_id: session.id },
          });

          console.log(`✅ Pacote ${planName} comprado: +${tokens.toLocaleString()} tokens para ${clerkId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        // Renovacao de assinatura - adiciona tokens novamente
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.billing_reason === "subscription_cycle") {
          const subscriptionId = invoice.subscription as string;

          // Buscar perfil pelo subscription_id
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("id, clerk_id, subscription_tier, credits_remaining")
            .eq("stripe_subscription_id", subscriptionId)
            .single();

          if (profile) {
            // Determinar tokens baseado no tier
            const tierTokens: Record<string, number> = {
              monthly: 10_000_000,
              semiannual: 70_000_000,
              annual: 175_000_000,
            };

            const tokens = tierTokens[profile.subscription_tier] || 10_000_000;

            await supabaseAdmin
              .from("profiles")
              .update({
                credits_remaining: (profile.credits_remaining || 0) + tokens,
              })
              .eq("id", profile.id);

            await supabaseAdmin.from("credits_history").insert({
              user_id: profile.id,
              amount: tokens,
              action_type: "subscription_renewal",
              description: `Renovacao de assinatura - ${tokens.toLocaleString("pt-BR")} tokens`,
              metadata: { subscription_id: subscriptionId, invoice_id: invoice.id },
            });

            console.log(`✅ Renovacao: +${tokens.toLocaleString()} tokens para ${profile.clerk_id}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const status = subscription.status;

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_status: status === "active" ? "active" : "inactive",
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log("✅ Subscription updated:", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        await supabaseAdmin
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_subscription_id", subscription.id);

        console.log("✅ Subscription canceled:", subscription.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
