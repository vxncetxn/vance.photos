const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    mode: 'jit',
    content: ['./src/**/*.{astro,html,js,jsx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Neue Montreal', ...defaultTheme.fontFamily.sans],
            },
        },
    },
};
