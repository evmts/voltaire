#!/usr/bin/env bun
/**
 * Package native binaries for distribution
 * Copies built native libraries to platform-specific package structure
 */

import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

type Platform =
	| "darwin-arm64"
	| "darwin-x64"
	| "linux-arm64"
	| "linux-x64"
	| "win32-x64";

interface PlatformConfig {
	platform: Platform;
	ext: string;
	sourceLib: string;
	targetLib: string;
}

const platforms: PlatformConfig[] = [
	{
		platform: "darwin-arm64",
		ext: "dylib",
		sourceLib: "libvoltaire_native.dylib",
		targetLib: "voltaire.darwin-arm64.node",
	},
	{
		platform: "darwin-x64",
		ext: "dylib",
		sourceLib: "libvoltaire_native.dylib",
		targetLib: "voltaire.darwin-x64.node",
	},
	{
		platform: "linux-arm64",
		ext: "so",
		sourceLib: "libvoltaire_native.so",
		targetLib: "voltaire.linux-arm64.node",
	},
	{
		platform: "linux-x64",
		ext: "so",
		sourceLib: "libvoltaire_native.so",
		targetLib: "voltaire.linux-x64.node",
	},
	{
		platform: "win32-x64",
		ext: "dll",
		sourceLib: "voltaire_native.dll",
		targetLib: "voltaire.win32-x64.node",
	},
];

async function packageNative(config: PlatformConfig) {
	const { platform, sourceLib, targetLib } = config;

	const sourcePath = join("zig-out", "native", platform, sourceLib);
	const targetDir = join("native", platform);
	const targetPath = join(targetDir, targetLib);

	// Check if source exists
	if (!existsSync(sourcePath)) {
		console.warn(`⚠️  Skipping ${platform}: Source not found at ${sourcePath}`);
		return false;
	}

	// Create target directory
	if (!existsSync(targetDir)) {
		mkdirSync(targetDir, { recursive: true });
	}

	// Copy and rename
	copyFileSync(sourcePath, targetPath);

	const stats = statSync(targetPath);
	const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
	return true;
}

async function main() {
	const args = process.argv.slice(2);
	const requestedPlatform = args[0] as Platform | undefined;

	const platformsToPackage = requestedPlatform
		? platforms.filter((p) => p.platform === requestedPlatform)
		: platforms;

	if (requestedPlatform && platformsToPackage.length === 0) {
		console.error(`❌ Unknown platform: ${requestedPlatform}`);
		console.error(`Available: ${platforms.map((p) => p.platform).join(", ")}`);
		process.exit(1);
	}

	let successCount = 0;
	let failCount = 0;

	for (const config of platformsToPackage) {
		const success = await packageNative(config);
		if (success) {
			successCount++;
		} else {
			failCount++;
		}
	}

	// Create native directory structure info
	if (successCount > 0) {
		await $`ls -lh native/*/*.node 2>/dev/null || echo "No .node files found"`;
	}
}

main().catch((error) => {
	console.error("❌ Error:", error);
	process.exit(1);
});
