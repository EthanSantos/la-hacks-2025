import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Uncut Sans',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config; 