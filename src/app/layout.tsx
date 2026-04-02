import type { Metadata, Viewport } from "next";
import { Geist, Source_Code_Pro } from "next/font/google";
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
        className="h-screen overflow-hidden bg-bg font-sans text-foreground antialiased"
      >
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
