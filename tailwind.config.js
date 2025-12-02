/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter_400Regular', 'System'],
        'inter-medium': ['Inter_500Medium', 'System'],
        'inter-semibold': ['Inter_600SemiBold', 'System'],
        'inter-bold': ['Inter_700Bold', 'System'],
        'inter-black': ['Inter_900Black', 'System'],
      },
    },
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};
