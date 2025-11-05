import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Voltaire',
			description: 'Ethereum primitives and cryptography library for TypeScript and Zig',
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/evmts/voltaire',
				},
				{
					icon: 'x.com',
					label: 'X',
					href: 'https://twitter.com/tevmtools',
				},
			],
			sidebar: [
				{
					label: 'Getting Started',
					items: [
						{ label: 'Introduction', slug: 'index' },
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Quick Start', slug: 'getting-started/quick-start' },
					],
				},
				{
					label: 'Core Primitives',
					autogenerate: { directory: 'primitives' },
				},
				{
					label: 'Cryptography',
					autogenerate: { directory: 'crypto' },
				},
			],
			customCss: [
				'./src/styles/custom.css',
			],
		}),
	],
});
