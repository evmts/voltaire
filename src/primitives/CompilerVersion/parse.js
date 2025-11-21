/**
 * Parse compiler version into components
 *
 * @param {import('./CompilerVersionType.js').CompilerVersionType} version - Version to parse
 * @returns {{ major: number, minor: number, patch: number, commit?: string, prerelease?: string }}
 *
 * @example
 * ```typescript
 * const parsed = CompilerVersion.parse("v0.8.20+commit.a1b2c3d4");
 * console.log(parsed.major); // 0
 * console.log(parsed.minor); // 8
 * console.log(parsed.patch); // 20
 * console.log(parsed.commit); // "a1b2c3d4"
 * ```
 */
export function parse(version) {
	// Remove leading 'v' if present
	const versionStr = version.startsWith("v") ? version.slice(1) : version;

	// Split on '+' to separate version from metadata (commit)
	const parts = versionStr.split("+");
	const versionPart = parts[0];
	const metadataPart = parts[1];

	// Split on '-' to handle prereleases (e.g., "0.8.20-alpha.1")
	const versionAndPrerelease = versionPart.split("-");
	const semverPart = versionAndPrerelease[0];
	const prerelease = versionAndPrerelease[1];

	// Parse semver (major.minor.patch)
	const semverParts = semverPart.split(".");

	if (semverParts.length < 2) {
		throw new Error(`Invalid semver format: ${versionStr}`);
	}

	const major = Number.parseInt(semverParts[0], 10);
	const minor = Number.parseInt(semverParts[1], 10);
	const patch = semverParts[2] ? Number.parseInt(semverParts[2], 10) : 0;

	if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
		throw new Error(`Invalid semver numbers: ${versionStr}`);
	}

	/** @type {{ major: number, minor: number, patch: number, commit?: string, prerelease?: string }} */
	const result = { major, minor, patch };

	// Extract commit hash if present (e.g., "commit.a1b2c3d4")
	if (metadataPart) {
		const commitMatch = metadataPart.match(/commit\.([a-f0-9]+)/);
		if (commitMatch) {
			result.commit = commitMatch[1];
		}
	}

	if (prerelease) {
		result.prerelease = prerelease;
	}

	return result;
}
