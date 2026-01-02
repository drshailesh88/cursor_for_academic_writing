import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        // Academic Theme: Deep purples & warm grays
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50: '#f6f5f9',
          100: '#edeaf3',
          200: '#d7d2e4',
          300: '#b5abcd',
          400: '#8d7db0',
          500: '#6f5d96',  // Main purple
          600: '#5a467c',
          700: '#4a3865',
          800: '#3f3055',
          900: '#362a49',
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          50: '#f9f8f7',
          100: '#f1eeeb',
          200: '#e4ddd7',
          300: '#d0c4b8',
          400: '#b8a693',
          500: '#a18a76',  // Warm gray
          600: '#8a7464',
          700: '#726054',
          800: '#5f5148',
          900: '#51463e',
        },

        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          // Scholarly gold for highlights
          50: '#fdfbf3',
          100: '#faf6e6',
          200: '#f4eac5',
          300: '#edd99b',
          400: '#e4c05f',
          500: '#d9a836',  // Gold accent
          600: '#bc872a',
          700: '#996724',
          800: '#7e5223',
          900: '#6a4422',
        },

        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },

        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-source-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
