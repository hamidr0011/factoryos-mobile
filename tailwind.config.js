/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        steel: {
          950: "#0A0C10",
          900: "#111318",
          800: "#1A1E26",
          700: "#242833",
          500: "#4A5266",
          300: "#9BA3B8",
          100: "#E8ECF5",
        },
        amber: {
          400: "#F59E0B",
          300: "#FCD34D",
        },
        module: {
          production: "#3B82F6",
          inventory: "#10B981",
          quality: "#8B5CF6",
          hr: "#F97316",
          maintenance: "#EF4444",
          finance: "#06B6D4",
        },
      },
      fontFamily: {
        display: ["SpaceGrotesk_700Bold"],
        body: ["Inter_400Regular"],
        mono: ["JetBrainsMono_400Regular"],
      },
    },
  },
  plugins: [],
};
