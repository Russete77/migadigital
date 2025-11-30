import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/server/supabase-admin";
import { SUBSCRIPTION_PLANS, TOKEN_PACKAGES } from "@/lib/constants/tokens";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { planId, type } = await req.json();

    // Validar tipo de compra
    if (!type || !["subscription", "package"].includes(type)) {
      return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
    }

    // Validar plano/pacote
    let priceId: string | undefined;
    let tokens: number;
    let mode: "subscription" | "payment";
    let planName: string;

    if (type === "subscription") {
      const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
      if (!plan) {
        return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
      }
      priceId = plan.stripePriceId;
      tokens = plan.tokens;
      mode = "subscription";
      planName = plan.name;
    } else {
      const pkg = TOKEN_PACKAGES[planId as keyof typeof TOKEN_PACKAGES];
      if (!pkg) {
        return NextResponse.json({ error: "Pacote invalido" }, { status: 400 });
      }
      priceId = pkg.stripePriceId;
      tokens = pkg.tokens;
      mode = "payment";
      planName = pkg.name;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: "Preco nao configurado no Stripe" },
        { status: 500 }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, stripe_customer_id")
      .eq("clerk_id", userId)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil nao encontrado" },
        { status: 404 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        metadata: {
          clerk_id: userId,
        },
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("clerk_id", userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      payment_method_types: ["card"],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens?canceled=true`,
      metadata: {
        clerk_id: userId,
        plan_id: planId,
        type,
        tokens: tokens.toString(),
        plan_name: planName,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout" },
      { status: 500 }
    );
  }
}
