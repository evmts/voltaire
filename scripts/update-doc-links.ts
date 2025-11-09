#!/usr/bin/env bun
/**
 * Updates MDX documentation to include:
 * 1. Correct repository URLs (evmts/voltaire instead of evmts/primitives)
 * 2. Test file links alongside source code links
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative, dirname, basename } from "path";

const REPO_URL = "https://github.com/evmts/voltaire";
const OLD_REPO_URL = "https://github.com/evmts/primitives";
const DOCS_DIR = "src/content/docs";
const SRC_DIR = "src";

interface LinkUpdate {
	file: string;
	oldUrl: string;
	newUrl: string;
	testUrl?: string;
}

function findMdxFiles(dir: string): string[] {
	const files: string[] = [];

	function walk(currentDir: string) {
		const entries = readdirSync(currentDir);

		for (const entry of entries) {
			const fullPath = join(currentDir, entry);
			const stat = statSync(fullPath);

			if (stat.isDirectory()) {
				walk(fullPath);
			} else if (entry.endsWith(".mdx") || entry.endsWith(".md")) {
				files.push(fullPath);
			}
		}
	}

	walk(dir);
	return files;
}

function extractSourcePath(url: string): string | null {
	// Extract path from GitHub URL
	// https://github.com/evmts/primitives/blob/main/src/primitives/Address/Address.js
	// -> src/primitives/Address/Address.js
	const match = url.match(/blob\/main\/(.+?)(?:#|$)/);
	return match ? match[1] : null;
}

function inferTestPath(sourcePath: string): string | null {
	// Convert source file to test file
	// src/primitives/Address/BrandedAddress/fromHex.js -> src/primitives/Address/BrandedAddress/fromHex.test.ts
	// src/primitives/Address/Address.js -> src/primitives/Address/Address.test.ts

	if (sourcePath.endsWith(".js")) {
		const testPath = sourcePath.replace(/\.js$/, ".test.ts");
		return testPath;
	} else if (sourcePath.endsWith(".ts")) {
		const testPath = sourcePath.replace(/\.ts$/, ".test.ts");
		return testPath;
	} else if (sourcePath.endsWith(".zig")) {
		// Zig tests are inline, link to the same file
		return sourcePath;
	}

	return null;
}

function buildTestUrl(sourcePath: string): string | null {
	const testPath = inferTestPath(sourcePath);
	if (!testPath) return null;

	// Check if test file exists
	try {
		const stat = statSync(testPath);
		if (stat.isFile()) {
			return `${REPO_URL}/blob/main/${testPath}`;
		}
	} catch {
		// File doesn't exist
		return null;
	}

	return null;
}

function updateMdxFile(filePath: string): LinkUpdate[] {
	let content = readFileSync(filePath, "utf-8");
	const updates: LinkUpdate[] = [];

	// First pass: replace all old repo URLs globally
	const originalContent = content;
	content = content.replace(new RegExp(OLD_REPO_URL, "g"), REPO_URL);

	// Count URL replacements
	const urlReplacements = (
		originalContent.match(new RegExp(OLD_REPO_URL, "g")) || []
	).length;

	// Second pass: add test links where missing
	const lines = content.split("\n");
	const newLines: string[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		newLines.push(line);

		// Check if this line has a "Defined in:" link
		const definedInMatch = line.match(/Defined in: \[([^\]]+)\]\(([^)]+)\)/);

		if (definedInMatch) {
			const [, linkText, url] = definedInMatch;

			// Check if next line already has a test link
			const nextLine = lines[i + 1];
			const hasTestLink = nextLine && nextLine.match(/^\s*Tests?: \[/);

			if (!hasTestLink) {
				// Try to add test link
				const sourcePath = extractSourcePath(url);
				if (sourcePath) {
					const testUrl = buildTestUrl(sourcePath);

					if (testUrl) {
						const testFileName = basename(testUrl);
						const testLinkMarkdown = `Tests: [${testFileName}](${testUrl})`;
						newLines.push(testLinkMarkdown);

						updates.push({
							file: filePath,
							oldUrl: "",
							newUrl: "",
							testUrl: testUrl,
						});
					}
				}
			}
		}
	}

	const newContent = newLines.join("\n");

	if (urlReplacements > 0) {
		for (let i = 0; i < urlReplacements; i++) {
			updates.push({
				file: filePath,
				oldUrl: OLD_REPO_URL,
				newUrl: REPO_URL,
			});
		}
	}

	if (newContent !== originalContent) {
		writeFileSync(filePath, newContent, "utf-8");
	}

	return updates;
}

function main() {
	console.log("🔍 Finding MDX files in", DOCS_DIR);
	const mdxFiles = findMdxFiles(DOCS_DIR);
	console.log(`📄 Found ${mdxFiles.length} documentation files`);

	const allUpdates: LinkUpdate[] = [];
	let filesUpdated = 0;
	let urlsUpdated = 0;
	let testsAdded = 0;

	for (const file of mdxFiles) {
		const updates = updateMdxFile(file);

		if (updates.length > 0) {
			filesUpdated++;
			allUpdates.push(...updates);

			for (const update of updates) {
				if (update.oldUrl !== update.newUrl) {
					urlsUpdated++;
				}
				if (update.testUrl) {
					testsAdded++;
				}
			}
		}
	}

	console.log("\n✅ Updates complete!");
	console.log(`📝 Files updated: ${filesUpdated}`);
	console.log(`🔗 URLs updated: ${urlsUpdated}`);
	console.log(`🧪 Test links added: ${testsAdded}`);

	if (allUpdates.length > 0) {
		console.log("\n📋 Sample updates:");
		for (const update of allUpdates.slice(0, 10)) {
			const relPath = relative(process.cwd(), update.file);
			console.log(`  ${relPath}`);
			if (update.testUrl) {
				console.log(`    + Added test link: ${basename(update.testUrl)}`);
			}
			if (update.oldUrl !== update.newUrl) {
				console.log(`    ✓ Updated repo URL`);
			}
		}

		if (allUpdates.length > 10) {
			console.log(`  ... and ${allUpdates.length - 10} more`);
		}
	}
}

main();
