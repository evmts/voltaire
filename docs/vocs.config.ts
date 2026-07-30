import { defineConfig } from "vocs/config";

export default defineConfig({
	title: "Voltaire",
	titleTemplate: "%s · Voltaire",
	baseUrl: "https://voltaire.tevm.sh",
	description:
		"Ethereum primitives and cryptography, written in Zig and shipped to TypeScript, Rust, Python, Go, Swift, and C.",
	rootDir: ".",
	editLink: {
		pattern:
			"https://github.com/evmts/voltaire/edit/main/docs/src/pages/:path",
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
