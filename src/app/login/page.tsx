/**
 * @module app/login
 * @description Login page
 * @safety GREEN
 */

import LoginForm from "@/modules/auth/ui/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center min-h-screen">
      <LoginForm />
    </main>
  );
}
