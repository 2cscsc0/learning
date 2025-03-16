import { text } from "stream/consumers";
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        background_secondary: "var(--background_secondary)", 
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        hover: "var(--hover)",
        focus: "var(--focus)",
        grey1: "var(--grey1)",
        grey2: "var(--grey2)",
        grey3: "var(--grey3)",
        grey4: "var(--grey4)",
        grey5: "var(--grey5)",
        grey6: "var(--grey6)",
        grey7: "var(--grey7)",
        grey8: "var(--grey8)",
        grey9: "var(--grey9)",
        border: "var(--border)",
        accent_primary: "var(--accent_primary)",
        accent_secondary: "var(--accent_secondary)"
      },
    },
  },
  plugins: [],
} satisfies Config;
