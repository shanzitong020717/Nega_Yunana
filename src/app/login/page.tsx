import { LoginView } from "@/features/auth/login-view";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return <LoginView error={params.error} />;
}
