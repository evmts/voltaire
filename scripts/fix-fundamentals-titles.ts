#!/usr/bin/env bun
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const primitivesDir = 'docs/primitives'

async function fixFundamentalsTitles() {
	const primitives = await readdir(primitivesDir)

	for (const primitive of primitives) {
		const fundamentalsPath = join(primitivesDir, primitive, 'fundamentals.mdx')

		try {
			let content = await readFile(fundamentalsPath, 'utf-8')

			// Capitalize first letter properly
			const capitalizedName = primitive.charAt(0).toUpperCase() + primitive.slice(1)

			// Replace title: Fundamentals with title: {Name} Fundamentals
			const updatedContent = content.replace(/^title: Fundamentals$/m, `title: ${capitalizedName} Fundamentals`)

			if (content !== updatedContent) {
				await writeFile(fundamentalsPath, updatedContent, 'utf-8')
				console.log(`✓ Updated: ${primitive} -> ${capitalizedName} Fundamentals`)
			}
		} catch (error) {
			// Skip if file doesn't exist
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error(`Error processing ${primitive}:`, error)
			}
		}
	}
}

fixFundamentalsTitles().catch(console.error)
