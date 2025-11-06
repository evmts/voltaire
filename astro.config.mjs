import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import liveCode from "astro-live-code";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
	vite: {
		ssr: {
			noExternal: ["react", "react-dom"],
		},
	},
	integrations: [
		react(),
		liveCode(),
		starlight({
			title: "Voltaire",
			description:
				"Ethereum primitives and cryptography library for TypeScript and Zig",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/evmts/voltaire",
				},
				{
					icon: "x.com",
					label: "X",
					href: "https://twitter.com/tevmtools",
				},
			],
			sidebar: [
				// TypeScript docs
				{
					label: "Getting Started",
					link: "/getting-started/",
				},
				{
					label: "Core Primitives",
					autogenerate: { directory: "primitives" },
				},
				{
					label: "Cryptography",
					autogenerate: { directory: "crypto" },
				},
				// Zig docs
				{
					label: "Zig Overview",
					link: "/zig/",
				},
				{
					label: "Zig Getting Started",
					link: "/zig/getting-started/",
				},
				{
					label: "Zig Contributing",
					link: "/zig/contributing/",
				},
				{
					label: "Zig Primitives",
					autogenerate: { directory: "zig/primitives" },
				},
				{
					label: "Zig Cryptography",
					autogenerate: { directory: "zig/crypto" },
				},
				{
					label: "Zig Precompiles",
					autogenerate: { directory: "zig/precompiles" },
				},
			],
			customCss: ["./src/styles/custom.css"],
		}),
	],
});
