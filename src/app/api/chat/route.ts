import { createVertex } from "@ai-sdk/google-vertex";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import ProductModel from "@/lib/models/Product";
import OrderModel from "@/lib/models/Order";
import LeadModel from "@/lib/models/Lead";
import { logError } from "@/lib/logger";
import { escapeRegex, getTotalQuantity } from "@/lib/utils";

function normalizePrivateKey(key?: string) {
  return key?.replace(/\\n/g, "\n");
}

function getVertex() {
  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  return createVertex({
    project,
    location,
    googleAuthOptions:
      clientEmail && privateKey
        ? {
            credentials: {
              client_email: clientEmail,
              private_key: privateKey,
            },
          }
        : undefined,
  });
}

function hasVertexConfig() {
  return Boolean(
    process.env.GOOGLE_VERTEX_PROJECT &&
      process.env.GOOGLE_VERTEX_LOCATION &&
      (process.env.GOOGLE_VERTEX_API_KEY ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY))
  );
}

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are the on-site assistant for Patch, an upcycled fashion label based in Dhaka, Bangladesh.
Brand motto: "Waste nothing, wear everything."

Voice: warm, concise, a little poetic about sustainability, never pushy or salesy.

What Patch sells: one-of-one and limited-batch garments made from upcycled waste textiles, factory offcuts,
and donated garments. One-of-one pieces are a single unique item, so their sizing is NOT standardized — tell
customers to check the exact measurements on the product page rather than assume a usual size will fit.
Limited-batch pieces come in a few standard sizes and colors, but stock per size/color is tiny — use
searchProducts to see which sizes are still available before quoting anything.

Your job:
- Answer sizing and product-care questions (upcycled/patchwork pieces should be hand-washed or gentle-cycled
  cold, air-dried, and not bleached, since panels can be mixed fabrics).
- Explain the "1-of-1 / limited batch" concept when asked — once a piece sells, it's gone for good.
- Use searchProducts to answer questions about what's in stock, prices, and availability. Share the product
  link so the customer can see photos and measurements.
- Use checkOrderStatus when a customer asks about their order — you need BOTH their order number and the
  email used at checkout. Never share order details unless both match.
- Use captureLead to save a customer's name and contact (phone or email) when they show buying intent or ask
  something you can't answer, so the team can follow up. Always ask permission before saving their details.
- If a tool returns nothing useful, say so plainly and offer to have the team follow up — never invent
  stock, prices, or order details.

Keep responses short — 2-4 sentences unless the customer asks for more detail.`;

const searchProducts = tool({
  description:
    "Search the live Patch catalog by name, description, or SKU. Returns up to 5 available pieces with price, availability, and product link.",
  inputSchema: z.object({
    query: z.string().describe("What the customer is looking for, e.g. 'denim jacket' or a SKU"),
  }),
  execute: async ({ query }) => {
    await connectToDatabase();
    const regex = { $regex: escapeRegex(query.trim()), $options: "i" };
    const products = await ProductModel.find({
      status: "available",
      $or: [{ name: regex }, { description: regex }, { sku: regex }],
    })
      .limit(5)
      .lean();

    return products.map((p) => ({
      name: p.name,
      sku: p.sku,
      price: p.price,
      currency: p.currency,
      category: p.category,
      rarity: p.rarity,
      piecesLeft: getTotalQuantity(p),
      sizes:
        p.rarity === "multi-quantity"
          ? (p.variants ?? [])
              .filter((v: { size: string; quantity: number }) => v.quantity > 0)
              .map((v: { size: string }) => v.size)
          : [p.size],
      link: `/shop/${p.slug}`,
    }));
  },
});

const checkOrderStatus = tool({
  description:
    "Look up an order's status. Requires the order number AND the email used at checkout — both must match.",
  inputSchema: z.object({
    orderNumber: z.string().describe("The order number, e.g. PATCH-XXXX-XXXX"),
    email: z.string().describe("The email address used when placing the order"),
  }),
  execute: async ({ orderNumber, email }) => {
    await connectToDatabase();
    const order = await OrderModel.findOne({ orderNumber: orderNumber.trim().toUpperCase() }).lean();

    if (!order || order.shippingAddress.email !== email.trim().toLowerCase()) {
      return { found: false, note: "No order matches that order number and email combination." };
    }

    return {
      found: true,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      currency: order.currency,
      trackingNumber: order.trackingNumber || null,
      carrier: order.carrier || null,
      placedAt: order.createdAt,
    };
  },
});

const captureLead = tool({
  description:
    "Save a customer's contact details so the Patch team can follow up. Only call this after the customer has agreed to share their name and a phone number or email.",
  inputSchema: z.object({
    name: z.string().describe("The customer's name"),
    contact: z.string().describe("Their phone number or email address"),
    interest: z.string().describe("What they were interested in or asking about"),
  }),
  execute: async ({ name, contact, interest }) => {
    await connectToDatabase();
    await LeadModel.create({ name, contact, interest, source: "chat" });
    return { saved: true, note: "The team will follow up soon." };
  },
});

export async function POST(req: Request) {
  if (!hasVertexConfig()) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Patch Assistant is not configured yet. Add Google Vertex credentials in Vercel environment variables.",
      },
      { status: 503 }
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: getVertex()("gemini-2.5-flash"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: { searchProducts, checkOrderStatus, captureLead },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      logError("Patch Assistant failed", error);
      return "Patch Assistant could not reply right now. Please try again in a moment.";
    },
  });
}
