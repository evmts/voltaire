// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "Primitives Library",
			description: "Ethereum primitives and cryptographic operations for TypeScript and Zig",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/roninjin10/primitives",
				},
			],
			sidebar: [
				{
					label: "TypeScript API",
					badge: { text: "Primary", variant: "success" },
					autogenerate: { directory: "typescript" },
				},
				{
					label: "Primitives (Zig)",
					badge: { text: "Native", variant: "tip" },
					autogenerate: { directory: "primitives" },
				},
				{
					label: "Crypto (Zig)",
					badge: { text: "Native", variant: "caution" },
					autogenerate: { directory: "crypto" },
				},
				{
					label: "Precompiles (Zig)",
					badge: { text: "0x01-0x13", variant: "note" },
					autogenerate: { directory: "precompiles" },
				},
			],
		}),
	],
});
