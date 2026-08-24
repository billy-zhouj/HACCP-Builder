import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProduct } from "@/lib/session";
import { db } from "@/lib/db";

const STRING_FIELDS = [
  "name",
  "foodCategory",
  "foodSubcategory",
  "productDescription",
  "intendedUse",
  "intendedConsumer",
  "packagingType",
  "shelfLifeAndStorage",
] as const;

export async function PATCH(req: Request, { params }: { params: { id: string; productId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const owned = await getOwnedProduct(params.id, params.productId, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const f of STRING_FIELDS) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  // Explicit null clears a category/subcategory selection.
  if ("foodCategory" in body && body.foodCategory === null) data.foodCategory = null;
  if ("foodSubcategory" in body && body.foodSubcategory === null) data.foodSubcategory = null;

  const updated = await db.product.update({ where: { id: owned.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string; productId: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const owned = await getOwnedProduct(params.id, params.productId, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  await db.product.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
}
