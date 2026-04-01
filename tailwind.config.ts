import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", ...fontFamily.sans],
        mono: ["var(--font-source-code-pro)", ...fontFamily.mono],
      },
      colors: {
        background: "hsl(var(--background-default))",
        foreground: "hsl(var(--foreground-default))",

        // Supabase Semantic Palette
        bg: "hsl(var(--background-default))",
        200: "hsl(var(--background-200))",
        alternative: "hsl(var(--background-alternative))",
        overlay: "hsl(var(--background-overlay))",
        brand: {
          DEFAULT: "hsl(var(--brand-default))",
          foreground: "hsl(var(--brand-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive-default))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning-default))",
          foreground: "hsl(var(--warning-foreground))",
        },
        surface: {
          100: "hsl(var(--background-surface-100))",
          200: "hsl(var(--background-surface-200))",
          300: "hsl(var(--background-surface-300))",
        },

        border: "hsl(var(--border-default))",
        strong: "hsl(var(--border-strong))",
        control: "hsl(var(--border-control))",
        input: "hsl(var(--border-control))",
        ring: "hsl(var(--brand-default))",

        light: "hsl(var(--foreground-light))",
        lighter: "hsl(var(--foreground-lighter))",
        muted: {
          DEFAULT: "hsl(var(--background-surface-200))",
          foreground: "hsl(var(--foreground-muted))",
        },

        // standard Shadcn mappings
        primary: {
          DEFAULT: "hsl(var(--brand-default))",
          foreground: "hsl(var(--brand-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--background-surface-200))",
          foreground: "hsl(var(--foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--background-surface-200))",
          foreground: "hsl(var(--foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--background-surface-100))",
          foreground: "hsl(var(--foreground-default))",
        },
        card: {
          DEFAULT: "hsl(var(--background-surface-100))",
          foreground: "hsl(var(--foreground-default))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
