#!/usr/bin/env npx tsx
/**
 * Post-process TypeDoc generated MDX files to add proper frontmatter titles
 */

import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

const GENERATED_API_DIR = "docs/generated-api";

async function processFile(filePath: string) {
	const content = await readFile(filePath, "utf-8");

	// Extract the title from the first # heading or derive from filename
	const headingMatch = content.match(/^#\s+(.+)$/m);
	const fileName = basename(filePath, ".mdx");
	const dirName = basename(dirname(filePath));

	let title = headingMatch?.[1] || fileName;
	// Clean up title - remove module prefixes like "@tevm/voltaire"
	title = title.replace("@tevm/voltaire", "").trim();
	if (title.startsWith("/")) title = title.slice(1);
	if (!title) title = fileName === "index" ? dirName : fileName;
	// Escape quotes in title
	title = title.replace(/"/g, '\\"');

	// Check if frontmatter exists
	if (content.startsWith("---")) {
		const frontmatterEnd = content.indexOf("---", 3);
		if (frontmatterEnd !== -1) {
			const frontmatter = content.slice(3, frontmatterEnd).trim();
			const restContent = content.slice(frontmatterEnd + 3);

			// Check if title already exists
			if (frontmatter.includes("title:")) {
				return; // Already has title
			}

			// Add title at the beginning of frontmatter
			const newContent = `---\ntitle: "${title}"\n${frontmatter}\n---${restContent}`;
			await writeFile(filePath, newContent);
			return;
		}
	}

	// Add new frontmatter with title
	const newContent = `---\ntitle: "${title}"\ndescription: Auto-generated API documentation\n---\n\n${content}`;
	await writeFile(filePath, newContent);
}

async function processDirectory(dirPath: string) {
	const entries = await readdir(dirPath);

	for (const entry of entries) {
		const fullPath = join(dirPath, entry);
		const stats = await stat(fullPath);

		if (stats.isDirectory()) {
			await processDirectory(fullPath);
		} else if (entry.endsWith(".mdx")) {
			await processFile(fullPath);
		}
	}
}

async function main() {
	await processDirectory(GENERATED_API_DIR);
}

main().catch(console.error);
