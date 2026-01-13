/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        border: {
          to: { "--border-angle": "360deg" },
        },
      },
      animation: {
        border: "border 4s linear infinite",
      },
    },
  },
  plugins: [require("daisyui")],
};
