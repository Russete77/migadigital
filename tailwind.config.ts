import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // FLAME COLORS - Design System Oficial
        flame: {
          DEFAULT: "#E94057",
          primary: "#E94057",
          dark: "#D5384B",
          light: "#F27089",
        },
        coral: "#FF6B6B",
        peach: "#FF8E53",
        sunset: "#FE6B8B",
        // Backgrounds - Sistema de Níveis (L0-L5) - Usando CSS Variables
        bg: {
          base: "var(--bg-base)",
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          elevated: "var(--bg-elevated)",
          active: "var(--bg-active)",
          input: "var(--bg-input)",
        },
        // Bordas profissionais - Usando CSS Variables
        border: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          default: "var(--border-default)",
          strong: "var(--border-strong)",
          flame: "var(--border-flame)",
        },
        // Text colors - Usando CSS Variables
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          disabled: "var(--text-disabled)",
        },
        // Accent Colors
        gold: "#FFD700",
        blue: "#5DADE2",
        purple: "#9B59B6",
        online: "#00E676",
        // Status colors
        danger: "#E94057",
        warning: "#F39C12",
        success: "#06D6A0",
        info: "#3498DB",

        // Aliases para compatibilidade com código legado (tinder-*, primary-*)
        "tinder-red": "#E94057",      // → danger
        "tinder-orange": "#F39C12",   // → warning
        "tinder-pink": "#F27089",     // → flame.light
        primary: {
          DEFAULT: "#E94057",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#E94057",  // Main color
          700: "#D5384B",
          800: "#B91C1C",
          900: "#7F1D1D",
        },

        // Aliases for Shadcn compatibility (border já definido acima com variantes)
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
        accent: ["Space Grotesk", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
      },
      spacing: {
        "1": "0.25rem",
        "2": "0.5rem",
        "3": "0.75rem",
        "4": "1rem",
        "5": "1.25rem",
        "6": "1.5rem",
        "8": "2rem",
        "10": "2.5rem",
        "12": "3rem",
        "16": "4rem",
        "20": "5rem",
        "24": "6rem",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        full: "9999px",
      },
      boxShadow: {
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        glow: "none",
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, #E94057 0%, #FF6B6B 50%, #FF8E53 100%)",
        "gradient-loading": "linear-gradient(135deg, #E94057 0%, #D5384B 100%)",
        "gradient-emergency": "radial-gradient(circle, #E94057 0%, #D5384B 70%, #8B2635 100%)",
        "gradient-gold": "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
        "gradient-dark": "linear-gradient(180deg, #1A1A1A 0%, #232323 100%)",
        "gradient-flame": "linear-gradient(135deg, #E94057 0%, #F27089 100%)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": {
            transform: "scale(1)",
            opacity: "1",
          },
          "70%": {
            transform: "scale(1.05)",
            opacity: "0.8",
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1",
          },
        },
        "typing": {
          "0%, 60%, 100%": {
            transform: "translateY(0)",
            opacity: "0.5",
          },
          "30%": {
            transform: "translateY(-8px)",
            opacity: "1",
          },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "typing": "typing 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
