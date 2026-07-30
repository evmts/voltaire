/**
 * The tevm.sh documentation family. Every entry below is a live site; the
 * shared top-nav dropdown and the landing-page grid are both generated from
 * this list so cross-repo navigation stays in one place.
 */
export type FamilySite = {
	id: string
	name: string
	url: string
	description: string
}

export const familySites: readonly FamilySite[] = [
	{ id: 'tevm', name: 'tevm', url: 'https://tevm.sh', description: 'The Ethereum toolchain in TypeScript.' },
	{
		id: 'contract',
		name: 'contract',
		url: 'https://contract.tevm.sh',
		description: 'Typed contract instances and ABI-aware actions.',
	},
	{
		id: 'logger',
		name: 'logger',
		url: 'https://logger.tevm.sh',
		description: 'The structured logger shared across tevm packages.',
	},
	{
		id: 'test',
		name: 'test',
		url: 'https://test.tevm.sh',
		description: 'Vitest integration, fixtures, and the Anvil-compatible surface.',
	},
	{
		id: 'bundler',
		name: 'bundler',
		url: 'https://bundler.tevm.sh',
		description: 'Import Solidity directly with Vite, Webpack, esbuild, or Bun.',
	},
	{ id: 'cli', name: 'cli', url: 'https://cli.tevm.sh', description: 'An EVM in your terminal, plus tevm-run.' },
	{
		id: 'ethers',
		name: 'ethers',
		url: 'https://ethers.tevm.sh',
		description: 'The ethers-flavoured client and provider integration.',
	},
	{ id: 'mud', name: 'mud', url: 'https://mud.tevm.sh', description: 'MUD framework integration for tevm.' },
	{
		id: 'examples',
		name: 'examples',
		url: 'https://examples.tevm.sh',
		description: 'End-to-end example applications you can copy.',
	},
	{
		id: 'voltaire',
		name: 'voltaire',
		url: 'https://voltaire.tevm.sh',
		description: 'Ethereum primitives and cryptography, written in Zig.',
	},
	{
		id: 'guillotine',
		name: 'guillotine',
		url: 'https://guillotine.tevm.sh',
		description: 'A high-performance EVM implementation in Zig.',
	},
	{ id: 'mini', name: 'mini', url: 'https://mini.tevm.sh', description: 'A small, readable EVM in Zig.' },
	{
		id: 'zevm',
		name: 'zevm',
		url: 'https://zevm.tevm.sh',
		description: 'The Zig EVM: build, C ABI, and embeddable execution.',
	},
]

export const currentSiteId = 'voltaire'
