import { defineConfig } from "vocs/config";
import { familySites } from "./src/sites.js";
import { accentColor, themeCss } from "./src/theme.js";

export default defineConfig({
	title: "Voltaire",
	titleTemplate: "%s · Voltaire",
	// Overridable so local `vocs preview` builds resolve assets from the
	// preview origin instead of production.
	baseUrl: process.env.VOCS_BASE_URL ?? "https://voltaire.tevm.sh",
	description:
		"Ethereum primitives and cryptography, written in Zig and shipped to TypeScript, Rust, Python, Go, Swift, and C.",
	rootDir: ".",
	// Matches the sibling tevm.sh sites (cli, logger, ethers, mud, bundler),
	// which all resolve --vocs-color-accent to light-dark(#0085FF, #4DA6FF).
	accentColor,
	colorScheme: "light dark",
	logoUrl: { light: "/tevm-logo-light.png", dark: "/tevm-logo-dark.png" },
	iconUrl: { light: "/tevm-logo-light.png", dark: "/tevm-logo-dark.png" },
	head: {
		link: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossorigin: "anonymous",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
			},
		],
		style: [{ innerHTML: themeCss }],
	},
	markdown: {
		code: {
			themes: { light: "github-light", dark: "github-dark" },
		},
	},
	editLink: {
		link: "https://github.com/evmts/voltaire/edit/main/docs/src/pages/:path",
		text: "Edit on GitHub",
	},
	socials: [
		{ icon: "github", link: "https://github.com/evmts/voltaire" },
		{ icon: "x", link: "https://x.com/tevmtools" },
		{ icon: "telegram", link: "https://t.me/+ANThR9bHDLAwMjUx" },
	],
	topNav: [
		{ text: "Docs", link: "/introduction", match: "/introduction" },
		{ text: "Guides", link: "/guides/hashing" },
		{ text: "Reference", link: "/reference/overview" },
		{
			text: "Playground",
			link: "https://playground.tevm.sh",
		},
		{
			text: "tevm docs",
			items: familySites.map((site) => ({
				text: site.name,
				link: site.url,
			})),
		},
	],
	sidebar: [
		{
			text: "Overview",
			items: [
				{ text: "Introduction", link: "/introduction" },
				{ text: "Installation", link: "/installation" },
				{ text: "Getting Started", link: "/getting-started" },
				{ text: "Where Voltaire Fits", link: "/ecosystem" },
			],
		},
		{
			text: "Guides",
			items: [
				{ text: "Hashing", link: "/guides/hashing" },
				{ text: "Addresses", link: "/guides/addresses" },
				{ text: "Keys & Signatures", link: "/guides/keys-and-signatures" },
				{ text: "ABI Encoding", link: "/guides/abi" },
				{ text: "RLP", link: "/guides/rlp" },
				{ text: "Transactions", link: "/guides/transactions" },
				{ text: "EIP-712 Typed Data", link: "/guides/eip712" },
				{ text: "Units & Denominations", link: "/guides/units" },
				{ text: "Effect Integration", link: "/guides/effect" },
			],
		},
		{
			text: "Native & Multi-language",
			items: [
				{ text: "Building from Source", link: "/native/building" },
				{ text: "Native, WASM & Portable JS", link: "/native/backends" },
				{ text: "Zig", link: "/native/zig" },
				{ text: "Other Languages", link: "/native/other-languages" },
			],
		},
		{
			text: "Reference",
			items: [
				{ text: "Overview", link: "/reference/overview" },
				{ text: "Primitives", link: "/reference/primitives" },
				{ text: "Cryptography", link: "/reference/crypto" },
				{ text: "Entry Points", link: "/reference/entry-points" },
			],
		},
	],
});
