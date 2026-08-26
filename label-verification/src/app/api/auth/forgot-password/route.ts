import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-auth";
import { sendPasswordResetEmail } from "@/lib/email";
import {
  buildPasswordResetUrl,
  forgotPasswordSchema,
  generatePasswordResetToken,
  hashPasswordResetToken,
  normalizePasswordResetEmail,
  passwordResetExpiryDate,
} from "@/lib/password-reset";

/**
 * Always returns a generic success payload so callers cannot probe which
 * emails have accounts. Enabled users receive a reset email when possible.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 400);
  }

  const email = normalizePasswordResetEmail(parsed.data.email);
  const generic = {
    ok: true as const,
    message:
      "If an account exists for that email, a password reset link has been sent.",
  };

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      enabled: true,
      siteId: true,
    },
  });

  if (!user || !user.enabled) {
    return NextResponse.json(generic);
  }

  const rawToken = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(rawToken);
  const expires = passwordResetExpiryDate();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: expires,
    },
  });

  try {
    await sendPasswordResetEmail({
      toEmail: user.email,
      siteId: user.siteId,
      resetUrl: buildPasswordResetUrl(rawToken),
      recipientName: user.name,
    });
  } catch (error) {
    // Clear the token so a failed send does not leave a usable reset hanging.
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      },
    });
    console.error("Failed to send password reset email", error);
    return jsonError("Could not send password reset email. Please try again later.", 503);
  }

  return NextResponse.json(generic);
}
