import type { Metadata, Viewport } from "next";
import { Geist, Source_Code_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { PwaRegistration } from "@/components/layout/PwaRegistration";
import { ThemeProvider } from "@/providers/ThemeProvider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-source-code-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DTR - Daily Time Record Tracker",
  description: "Track your daily time records efficiently",
  applicationName: "DTR Tracker",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

const themeInitScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("theme");
    const resolvedTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  } catch {
    const root = document.documentElement;
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }
})();
`;

const devCacheResetScript = `
(() => {
  const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (!isLocal) {
    return;
  }

  const resetFlag = "__dtr_dev_cache_reset_v1__";
  if (sessionStorage.getItem(resetFlag) === "1") {
    return;
  }

  sessionStorage.setItem(resetFlag, "1");

  const clearStaleRuntime = async () => {
    let hadRegistrations = false;
    let hadCaches = false;

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        hadRegistrations = registrations.length > 0;
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        hadCaches = keys.length > 0;
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      return;
    }

    if (hadRegistrations || hadCaches) {
      location.reload();
    }
  };

  void clearStaleRuntime();
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${sourceCodePro.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        suppressHydrationWarning
        className="h-screen overflow-hidden bg-bg font-sans text-foreground antialiased"
      >
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {process.env.NODE_ENV !== "production" ? (
          <Script id="dev-cache-reset" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: devCacheResetScript }} />
        ) : null}
        <ThemeProvider>
          <QueryProvider>
            <PwaRegistration />
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
