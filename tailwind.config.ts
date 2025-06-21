import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // If you still have a pages directory
    './components/**/*.{js,ts,jsx,tsx,mdx}', // If you have a global components directory
    './app/**/*.{js,ts,jsx,tsx,mdx}', // For the app directory
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Example: using Inter font
      },
      // Add any custom theme extensions here
    },
  },
  plugins: [],
};
export default config;
