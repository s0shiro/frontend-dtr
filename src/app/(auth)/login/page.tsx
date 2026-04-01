'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn.email(
        { email, password },
        {
          onSuccess: () => {
            router.push('/');
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Sign in failed');
          },
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-alternative p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-sm font-normal text-foreground">Sign in to DTR Tracker</h1>
          <p className="text-xs text-light">Use your account credentials to continue</p>
        </div>

        <div className="bg-surface-100 border border-control rounded-md shadow-sm p-6 space-y-4">
          {error && (
            <div className="rounded-md border border-destructive bg-surface-200 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-light">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-light">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="border-t border-control pt-4 text-center text-xs text-light">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-foreground hover:text-light transition-colors">
              Create one
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-lighter">
          By continuing, you agree to the DTR Tracker terms and privacy policy.
        </p>
      </div>
    </div>
  );
}