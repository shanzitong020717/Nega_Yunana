import { z } from "zod";

const requiredString = (message: string) =>
  z.preprocess(
    (value) => (value === undefined || value === null ? "" : value),
    z.string().trim().min(1, message),
  );

const requiredUrl = (requiredMessage: string, urlMessage: string) =>
  requiredString(requiredMessage).pipe(z.string().url(urlMessage));

const serverEnvSchema = z.object({
  OPENAI_API_KEY: requiredString("OPENAI_API_KEY is required"),
  DATABASE_URL: requiredUrl(
    "DATABASE_URL is required",
    "DATABASE_URL must be a valid URL",
  )
    .refine(
      (value) =>
        value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string",
    ),
  APP_BASE_URL: requiredUrl(
    "APP_BASE_URL is required",
    "APP_BASE_URL must be a valid URL",
  ),
  UPLOAD_DIR: requiredString("UPLOAD_DIR is required"),
  NEXT_PUBLIC_SUPABASE_URL: requiredUrl(
    "NEXT_PUBLIC_SUPABASE_URL is required",
    "NEXT_PUBLIC_SUPABASE_URL must be a valid URL",
  ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredString(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required",
  ),
  CONFIDENTIAL_MODE_DEFAULT: z
    .preprocess(
      (value) => (value === undefined || value === null ? "true" : value),
      z.enum(["true", "false"], {
        error: "CONFIDENTIAL_MODE_DEFAULT must be true or false",
      }),
    )
    .transform((value) => value === "true"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedServerEnv: ServerEnv | null = null;

export function parseServerEnv(
  input: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(input);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    throw new Error(firstIssue?.message ?? "Invalid server environment");
  }

  return result.data;
}

export function getServerEnv() {
  if (!cachedServerEnv) {
    cachedServerEnv = parseServerEnv(process.env);
  }

  return cachedServerEnv;
}
