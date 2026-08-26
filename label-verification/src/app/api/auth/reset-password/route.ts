import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-auth";
import {
  hashPasswordResetToken,
  isPasswordResetExpired,
  resetPasswordSchema,
} from "@/lib/password-reset";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const tokenHash = hashPasswordResetToken(parsed.data.token);
  const user = await prisma.user.findFirst({
    where: { passwordResetTokenHash: tokenHash },
    select: {
      id: true,
      enabled: true,
      passwordResetExpires: true,
    },
  });

  if (!user || !user.enabled || isPasswordResetExpired(user.passwordResetExpires)) {
    return jsonError("This reset link is invalid or has expired.", 400);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Password updated. You can sign in with your new password.",
  });
}
