'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';

  if (!mounted) {
    return (
      <button
        type="button"
        aria-hidden="true"
        className="inline-flex h-7 items-center gap-2 rounded-md border border-control bg-surface-200 px-2 text-xs text-light hover:bg-surface-300 hover:text-foreground"
      >
        <Sun className="h-3 w-3" />
        Theme
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-7 items-center gap-2 rounded-md border border-control bg-surface-200 px-2 text-xs text-light hover:bg-surface-300 hover:text-foreground"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
      Theme
    </button>
  );
}