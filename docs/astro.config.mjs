// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "Primitives Library",
			description: "Ethereum primitives and cryptographic operations in Zig",
			social: [
				{
					icon: "github",
					label: "GitHub",
					href: "https://github.com/roninjin10/primitives",
				},
			],
			sidebar: [
				{
					label: "Primitives",
					badge: { text: "Core", variant: "tip" },
					autogenerate: { directory: "primitives" },
				},
				{
					label: "Crypto",
					badge: { text: "Security", variant: "caution" },
					autogenerate: { directory: "crypto" },
				},
				{
					label: "Precompiles",
					badge: { text: "0x01-0x13", variant: "note" },
					autogenerate: { directory: "precompiles" },
				},
			],
		}),
	],
});
