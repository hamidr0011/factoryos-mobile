/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        steel: {
          950: "#F3F4F6",
          900: "#FFFFFF",
          800: "#ECEFF3",
          700: "#E0E3E8",
          500: "#747D8C",
          300: "#22242A",
          100: "#000000",
        },
        amber: {
          400: "#0067FF",
          300: "#3385FF",
        },
        module: {
          production: "#1A62E8",
          inventory: "#1FA869",
          quality: "#7E57C2",
          hr: "#E65100",
          maintenance: "#D32F2F",
          finance: "#00838F",
        },
      },
      borderRadius: {
        cell: "8px",
        card: "24px",
        modal: "26px",
        sheet: "32px",
      },
      fontFamily: {
        display: ["Inter_700Bold"],
        body: ["Inter_400Regular"],
        mono: ["JetBrainsMono_400Regular"],
      },
    },
  },
  plugins: [],
};
