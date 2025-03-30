/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        lightBeige: "#fef8e9",
        beige: "#edddb5",
        mediumBeige: "#a09070",
        darkBeige: "#7c6732",
        greyBeige: "#b7a987",
        black: "#12110f",
        grey: "#cecdcc",
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
  safelist: ["w-1/4", "w-1/3", "w-1/2", "w-full"],
};
