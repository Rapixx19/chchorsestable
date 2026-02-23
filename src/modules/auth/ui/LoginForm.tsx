/**
 * @module auth/ui
 * @description Login and signup form component
 * @safety RED
 */

'use client';

import { useState } from 'react';
import { authService } from '../services/auth.service';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    console.log("LOGIN CLICKED");
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const result = await authService.login(email, password);
    console.log("LOGIN RESULT:", result);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Login failed');
      return;
    }

    if (result.success) {
      console.log("REDIRECTING");
      window.location.href = '/dashboard';
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const result = await authService.signup(email, password);

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Signup failed');
      return;
    }

    setMessage('Account created. Check your email to confirm.');
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm p-6">
      <h1 className="text-2xl font-bold text-center">Login</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        className="border rounded px-3 py-2"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {message && <p className="text-green-500 text-sm">{message}</p>}

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        Login
      </button>

      <button
        onClick={handleSignUp}
        disabled={isLoading}
        className="border border-blue-500 text-blue-500 py-2 rounded hover:bg-blue-50 disabled:opacity-50"
      >
        Create account
      </button>
    </div>
  );
}
