import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name")
    .max(80, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email address")),
  // bcrypt silently truncates input after 72 bytes, so reject longer values
  // instead of treating two different passwords as the same.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password is too long")
    .refine((value) => new TextEncoder().encode(value).length <= 72, {
      message: "Password must be 72 bytes or fewer",
    }),
  template: z.enum(["rugby-sevens", "blank"]).default("rugby-sevens"),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email address")),
  password: z.string().min(1, "Enter your password").max(200),
  next: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type AuthFormState =
  | {
      error?: string;
      fieldErrors?: Record<string, string[] | undefined>;
    }
  | undefined;

const APP_ORIGIN = new URL("https://app.invalid").origin;
const UNSAFE_CHARS = /[\\\u0000-\u001f\u007f]/;

/**
 * Only allow same-app relative paths to avoid open redirects.
 *
 * Browsers treat `\` as `/` in http(s) URLs, so `/[\]evil.com` and the
 * percent-encoded variant would otherwise escape to another host. Parsing the
 * candidate against a fixed origin and rejecting backslashes/control characters
 * (before and after decoding) closes those bypasses.
 */
export function safeNextPath(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  if (UNSAFE_CHARS.test(next)) return "/";

  let decoded: string;
  try {
    decoded = decodeURIComponent(next);
  } catch {
    return "/";
  }
  if (UNSAFE_CHARS.test(decoded) || decoded.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(next, APP_ORIGIN);
  } catch {
    return "/";
  }
  if (url.origin !== APP_ORIGIN) return "/";
  if (!url.pathname.startsWith("/") || url.pathname.startsWith("//")) {
    return "/";
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
