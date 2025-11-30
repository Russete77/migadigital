import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/server/supabase-admin";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  // Get body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error: Webhook verification failed", err);
    return new Response("Error: Webhook verification failed", { status: 400 });
  }

  // Handle events
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      const { error } = await supabaseAdmin.from("profiles").insert({
        clerk_id: id,
        email: email_addresses[0]?.email_address || "",
        full_name: `${first_name || ""} ${last_name || ""}`.trim() || null,
        avatar_url: image_url || null,
        subscription_tier: "free",
        subscription_status: "inactive",
        credits_remaining: 3,
        onboarding_completed: false,
      });

      if (error) {
        console.error("Error creating profile:", error);
        return new Response("Error creating profile", { status: 500 });
      }

      console.log("✅ Profile created successfully for:", email_addresses[0]?.email_address);
    } catch (error) {
      console.error("Error in user.created webhook:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          email: email_addresses[0]?.email_address || "",
          full_name: `${first_name || ""} ${last_name || ""}`.trim() || null,
          avatar_url: image_url || null,
        })
        .eq("clerk_id", id);

      if (error) {
        console.error("Error updating profile:", error);
      }
    } catch (error) {
      console.error("Error in user.updated webhook:", error);
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    try {
      const { error } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("clerk_id", id);

      if (error) {
        console.error("Error deleting profile:", error);
      }
    } catch (error) {
      console.error("Error in user.deleted webhook:", error);
    }
  }

  return new Response("Webhook processed successfully", { status: 200 });
}
