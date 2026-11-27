"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/client-ip";
import {
  LOGIN_ACCOUNT_RULE,
  LOGIN_IP_RULE,
  REGISTER_IP_RULE,
  checkLimit,
  clearLimit,
  recordLimitHit,
} from "@/lib/rate-limit";
import { seedTemplate } from "@/lib/seed";
import { clearSession, createSession } from "@/lib/session";
import {
  loginSchema,
  registerSchema,
  safeNextPath,
  type AuthFormState,
} from "@/lib/validation";

const DUMMY_HASH =
  "$2b$12$qePI6wusRxa6sdtJLTTLV.wsYJ.K9Wa2K1ib0FLKtgn7SCWiPON.K";

export async function registerAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ip = await getClientIp();
  const registerLimit = checkLimit("register-ip", ip, REGISTER_IP_RULE);
  if (!registerLimit.allowed) {
    return {
      error: "Too many accounts created from this network. Please try again later.",
    };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    template: formData.get("template") ?? undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, template } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  // Count the attempt before the expensive hash so a burst of parallel requests
  // cannot all slip past the limit check.
  recordLimitHit("register-ip", ip, REGISTER_IP_RULE);

  const passwordHash = await hash(password, 12);

  let userId: string;
  try {
    userId = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash },
        select: { id: true },
      });
      await seedTemplate(tx, user.id, template);
      return user.id;
    });
  } catch {
    return {
      error: "We could not create your account. Please try again.",
    };
  }

  await createSession(userId);
  redirect("/");
}

export async function loginAction(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, password, next } = parsed.data;
  const ip = await getClientIp();
  const accountKey = `${ip}:${email}`;

  const accountLimit = checkLimit("login-account", accountKey, LOGIN_ACCOUNT_RULE);
  const ipLimit = checkLimit("login-ip", ip, LOGIN_IP_RULE);
  if (!accountLimit.allowed || !ipLimit.allowed) {
    const retryAfter = Math.max(
      accountLimit.retryAfterSeconds,
      ipLimit.retryAfterSeconds,
    );
    return {
      error: `Too many attempts. Try again in ${Math.ceil(
        retryAfter / 60,
      )} minute(s).`,
    };
  }

  // Count before the bcrypt comparison so concurrent guesses are all counted.
  recordLimitHit("login-account", accountKey, LOGIN_ACCOUNT_RULE);
  recordLimitHit("login-ip", ip, LOGIN_IP_RULE);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  // Always run a bcrypt comparison so a missing account is not faster.
  // bcrypt only reads the first 72 bytes; the login schema caps input at 200
  // characters, and registration rejects anything longer than 72 bytes.
  const valid = await compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    return { error: "Invalid email or password" };
  }

  clearLimit("login-account", accountKey);
  await createSession(user.id);
  redirect(safeNextPath(next));
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
