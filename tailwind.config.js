/** @type {import('tailwindcss').Config} */
var config = {
	content: [
		"./Public/**/*.html",
		"./Source/**/*.{astro,css,html,js,json,jsx,md,mdx,scss,svelte,ts,tsx,vue}",
		"./index.html",
		__dirname + "/**/*.vue",
		__dirname + "/frontend/**/*.{css,html,ts,js}",
		__dirname + "/src/main.js",
		__dirname + "/src/{components,views}/**/*.js",
	],

	darkMode: "media",

	theme: {
		container: {
			center: true,
		},
	},

	plugins: [
		require("@tailwindcss/forms"),
		require("@tailwindcss/typography"),
		require("@tailwindcss/aspect-ratio"),
	],
};
