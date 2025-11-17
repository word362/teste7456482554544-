import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
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
      backgroundImage: {
        'gradient-card': 'var(--gradient-card)',
        'gradient-hover': 'var(--gradient-hover)',
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-glass': 'var(--gradient-glass)',
        'gradient-mesh': 'var(--gradient-mesh)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'hover': 'var(--shadow-hover)',
        'glow': 'var(--shadow-glow)',
        'glow-accent': 'var(--shadow-glow-accent)',
        'neon': 'var(--shadow-neon)',
      },
      transitionProperty: {
        'smooth': 'var(--transition-smooth)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "scale-in": {
          "0%": {
            transform: "scale(0.95)",
            opacity: "0"
          },
          "100%": {
            transform: "scale(1)",
            opacity: "1"
          }
        },
        "slide-in-right": {
          "0%": { 
            transform: "translateX(-20px)",
            opacity: "0"
          },
          "100%": { 
            transform: "translateX(0)",
            opacity: "1"
          }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "glow-pulse": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsla(142, 76%, 36%, 0.3)"
          },
          "50%": { 
            boxShadow: "0 0 40px hsla(142, 76%, 36%, 0.6)"
          }
        },
        "float-particle": {
          "0%, 100%": { 
            transform: "translate(0, 0) rotate(0deg) scale(1)",
            opacity: "0.6"
          },
          "25%": { 
            transform: "translate(30px, -40px) rotate(90deg) scale(1.1)",
            opacity: "0.8"
          },
          "50%": { 
            transform: "translate(-20px, -80px) rotate(180deg) scale(0.9)",
            opacity: "1"
          },
          "75%": { 
            transform: "translate(-40px, -40px) rotate(270deg) scale(1.05)",
            opacity: "0.7"
          }
        },
        "neon-glow": {
          "0%, 100%": {
            textShadow: "0 0 10px hsla(158, 90%, 48%, 0.5), 0 0 20px hsla(158, 90%, 48%, 0.3)"
          },
          "50%": {
            textShadow: "0 0 20px hsla(158, 90%, 48%, 0.8), 0 0 40px hsla(158, 90%, 48%, 0.5), 0 0 60px hsla(180, 95%, 55%, 0.3)"
          }
        },
        "slide-up": {
          "0%": {
            transform: "translateY(30px)",
            opacity: "0"
          },
          "100%": {
            transform: "translateY(0)",
            opacity: "1"
          }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.6s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "neon-glow": "neon-glow 2s ease-in-out infinite",
        "float-particle": "float-particle var(--duration, 25s) ease-in-out infinite",
        "float-slow": "float-slow 35s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
