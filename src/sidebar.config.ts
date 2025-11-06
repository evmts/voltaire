/**
 * Dual sidebar configuration for TypeScript and Zig documentation
 *
 * TypeScript docs: /primitives/, /crypto/, /getting-started
 * Zig docs: /zig/*
 */

export const tsSidebar = [
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
];

export const zigSidebar = [
	{
		label: "Zig Overview",
		link: "/zig/",
	},
	{
		label: "Getting Started",
		link: "/zig/getting-started/",
	},
	{
		label: "Contributing",
		link: "/zig/contributing/",
	},
	{
		label: "Primitives",
		autogenerate: { directory: "zig/primitives" },
	},
	{
		label: "Cryptography",
		autogenerate: { directory: "zig/crypto" },
	},
	{
		label: "Precompiles",
		autogenerate: { directory: "zig/precompiles" },
	},
];

/**
 * Determine which sidebar to show based on current URL path
 */
export function getSidebarForPath(pathname: string) {
	return pathname.startsWith("/zig") ? zigSidebar : tsSidebar;
}
