#!/usr/bin/env bun
/**
 * Migrate crypto documentation from Starlight to Mintlify format
 *
 * Converts:
 * - Removes Astro/Starlight imports
 * - Converts Tabs/TabItem to Mintlify CodeGroup/Code
 * - Converts Aside to Mintlify callouts
 * - Preserves frontmatter and content
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join, relative } from "path";

const SOURCE_DIR = "/Users/williamcory/voltaire/src/content/docs/crypto";
const DEST_DIR = "/Users/williamcory/voltaire/docs/crypto";

const FILES = [
	"aesgcm/decryption.mdx",
	"aesgcm/encryption.mdx",
	"aesgcm/index.mdx",
	"aesgcm/security.mdx",
	"aesgcm/test-vectors.mdx",
	"bip39/generation.mdx",
	"bip39/index.mdx",
	"bip39/passphrase.mdx",
	"bip39/security.mdx",
	"bip39/seed-derivation.mdx",
	"bip39/validation.mdx",
	"bip39/wordlists.mdx",
	"blake2/index.mdx",
	"bls12-381.mdx",
	"bls12-381/aggregation.mdx",
	"bls12-381/g1-operations.mdx",
	"bls12-381/g2-operations.mdx",
	"bls12-381/index.mdx",
	"bls12-381/pairing.mdx",
	"bls12-381/performance.mdx",
	"bls12-381/precompiles.mdx",
	"bls12-381/security.mdx",
	"bls12-381/signatures.mdx",
	"bls12-381/test-vectors.mdx",
	"bls12-381/usage-patterns.mdx",
	"bn254.mdx",
	"bn254/g1-operations.mdx",
	"bn254/g2-operations.mdx",
	"bn254/index.mdx",
	"bn254/pairing.mdx",
	"bn254/performance.mdx",
	"bn254/precompiles.mdx",
	"bn254/test-vectors.mdx",
	"bn254/usage-patterns.mdx",
	"bn254/zk-usage.mdx",
	"chacha20poly1305/index.mdx",
	"comparison.mdx",
	"ed25519/index.mdx",
	"eip712/index.mdx",
	"hdwallet/child-derivation.mdx",
	"hdwallet/derivation-paths.mdx",
	"hdwallet/extended-keys.mdx",
	"hdwallet/index.mdx",
	"keccak256/index.mdx",
	"kzg.mdx",
	"kzg/commitments.mdx",
	"kzg/eip-4844.mdx",
	"kzg/index.mdx",
	"kzg/performance.mdx",
	"kzg/point-evaluation.mdx",
	"kzg/proofs.mdx",
	"kzg/test-vectors.mdx",
	"kzg/trusted-setup.mdx",
	"kzg/usage-patterns.mdx",
	"p256/index.mdx",
	"ripemd160/index.mdx",
	"secp256k1/index.mdx",
	"secp256k1/key-derivation.mdx",
	"secp256k1/performance.mdx",
	"secp256k1/point-operations.mdx",
	"secp256k1/recovery.mdx",
	"secp256k1/security.mdx",
	"secp256k1/signing.mdx",
	"secp256k1/test-vectors.mdx",
	"secp256k1/usage-patterns.mdx",
	"secp256k1/verification.mdx",
	"sha256/api-reference.mdx",
	"sha256/comparison.mdx",
	"sha256/index.mdx",
	"sha256/performance.mdx",
	"sha256/security.mdx",
	"sha256/test-vectors.mdx",
	"sha256/usage-patterns.mdx",
	"symmetric-encryption-comparison.mdx",
	"wallet-integration.mdx",
	"x25519/index.mdx",
];

function convertStarlightToMintlify(content: string): string {
	// Remove Starlight imports
	content = content.replace(
		/^import\s+\{[^}]+\}\s+from\s+['"]@astrojs\/starlight\/components['"];?\s*$/gm,
		"",
	);

	// Convert <Tabs>/<TabItem> to Mintlify <Tabs>/<Tab>
	content = content.replace(/<Tabs>\s*/g, "<Tabs>\n");
	content = content.replace(/<\/Tabs>/g, "</Tabs>");
	content = content.replace(
		/<TabItem\s+label=["']([^"']+)["']>/g,
		'<Tab title="$1">',
	);
	content = content.replace(/<\/TabItem>/g, "</Tab>");

	// Convert <Aside> to Mintlify callouts
	// Handle Aside with both type and title
	content = content.replace(
		/<Aside\s+type=["'](\w+)["']\s+title=["']([^"']+)["']>/g,
		(match, type, title) => {
			const calloutType =
				type === "caution"
					? "Warning"
					: type === "tip"
						? "Tip"
						: type === "note"
							? "Note"
							: type === "danger"
								? "Warning"
								: "Note";
			return `<${calloutType} title="${title}">`;
		},
	);

	// Handle Aside with only type
	content = content.replace(/<Aside\s+type=["'](\w+)["']>/g, (match, type) => {
		const calloutType =
			type === "caution"
				? "Warning"
				: type === "tip"
					? "Tip"
					: type === "note"
						? "Note"
						: type === "danger"
							? "Warning"
							: "Note";
		return `<${calloutType}>`;
	});

	// Replace closing Aside tags
	content = content.replace(/<\/Aside>/g, (match) => {
		// Try to find what type it was (scan backwards)
		const beforeMatch = content.substring(0, content.indexOf(match));
		const lastAside = beforeMatch.lastIndexOf("<");
		const asideTag = content.substring(
			lastAside,
			content.indexOf(">", lastAside) + 1,
		);

		if (
			asideTag.includes("Warning") ||
			asideTag.includes("warning") ||
			asideTag.includes("caution") ||
			asideTag.includes("danger")
		) {
			return "</Warning>";
		} else if (asideTag.includes("Tip") || asideTag.includes("tip")) {
			return "</Tip>";
		} else {
			return "</Note>";
		}
	});

	// Clean up multiple blank lines
	content = content.replace(/\n\n\n+/g, "\n\n");

	return content.trim() + "\n";
}

function migrateFile(relativePath: string): void {
	const sourcePath = join(SOURCE_DIR, relativePath);
	const destPath = join(DEST_DIR, relativePath);

	// Read source
	const content = readFileSync(sourcePath, "utf-8");

	// Convert
	const converted = convertStarlightToMintlify(content);

	// Ensure destination directory exists
	const destDir = dirname(destPath);
	if (!existsSync(destDir)) {
		mkdirSync(destDir, { recursive: true });
	}

	// Write destination
	writeFileSync(destPath, converted);

	console.log(`✓ ${relativePath}`);
}

// Main
console.log(`Migrating ${FILES.length} crypto documentation files...\n`);

let successful = 0;
let failed = 0;

for (const file of FILES) {
	try {
		migrateFile(file);
		successful++;
	} catch (error) {
		console.error(`✗ ${file}: ${error}`);
		failed++;
	}
}

console.log(`\nMigration complete:`);
console.log(`  Successful: ${successful}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total: ${FILES.length}`);

// Count directories
const dirs = new Set(FILES.map((f) => dirname(f)).filter((d) => d !== "."));
console.log(`  Directories: ${dirs.size}`);
