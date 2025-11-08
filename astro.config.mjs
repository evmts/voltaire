import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
	integrations: [
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
				{
					label: "Precompiles",
					autogenerate: { directory: "precompiles" },
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
