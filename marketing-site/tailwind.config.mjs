/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Tajawal", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Amiri", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        brand: {
          50: "#FBF9F1",
          100: "#F5F0DC",
          200: "#EAD8A0",
          300: "#DFC06B",
          400: "#D4AF37",
          500: "#B4942B",
          600: "#8C701D",
          700: "#695313",
          800: "#48380C",
          900: "#2A2005",
        },
        dark: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
          950: "#020202",
        },
        babil: {
          black: "#020202",
          dark: "#080808",
          card: "#0D0D0D",
          glass: "rgba(13, 13, 13, 0.7)",
        },
      },
      boxShadow: {
        brand: "0 4px 14px 0 rgba(212, 175, 55, 0.39)",
        "brand-lg": "0 10px 25px -5px rgba(212, 175, 55, 0.4)",
        luxury: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
        glow: "0 0 40px rgba(212, 175, 55, 0.12)",
      },
    },
  },
  plugins: [],
};
