/**
 * Platform detection utilities for native bindings
 */

export type Platform =
	| "darwin-arm64"
	| "darwin-x64"
	| "linux-arm64"
	| "linux-x64"
	| "win32-x64";

/**
 * Get current platform identifier
 */
export function getPlatform(): Platform {
	const platform = process.platform;
	const arch = process.arch;

	const platformMap: Record<string, string> = {
		darwin: "darwin",
		linux: "linux",
		win32: "win32",
	};

	const archMap: Record<string, string> = {
		x64: "x64",
		arm64: "arm64",
	};

	const mappedPlatform = platformMap[platform];
	const mappedArch = archMap[arch];

	if (!mappedPlatform || !mappedArch) {
		throw new Error(
			`Unsupported platform: ${platform}-${arch}. Supported: darwin-arm64, darwin-x64, linux-arm64, linux-x64, win32-x64`,
		);
	}

	return `${mappedPlatform}-${mappedArch}` as Platform;
}

/**
 * Get file extension for native libraries on current platform
 */
export function getNativeExtension(): string {
	const platform = process.platform;

	switch (platform) {
		case "darwin":
			return "dylib";
		case "linux":
			return "so";
		case "win32":
			return "dll";
		default:
			throw new Error(`Unsupported platform: ${platform}`);
	}
}

/**
 * Check if native bindings are supported on current platform
 */
export function isNativeSupported(): boolean {
	try {
		getPlatform();
		return true;
	} catch {
		return false;
	}
}

/**
 * Get path to native library file
 * @param moduleName - Name of the module (default: 'voltaire_native')
 * @param subpath - Optional subpath (e.g., 'crypto')
 */
export function getNativeLibPath(
	moduleName = "voltaire_native",
	subpath?: string,
): string {
	const platform = getPlatform();
	const ext = getNativeExtension();

	// Try platform package first (optionalDependencies)
	try {
		const pkgName = `@tevm/voltaire-${platform}`;
		const filename = `${moduleName}.${platform}.node`;
		const modulePath = subpath
			? `${pkgName}/${subpath}/${filename}`
			: `${pkgName}/${filename}`;

		return require.resolve(modulePath);
	} catch {
		// Fall back to local build output
		// Try platform-specific subdirectory first
		const libname = `lib${moduleName}.${ext}`;
		const platformSpecificPath = subpath
			? `./zig-out/native/${platform}/${subpath}/${libname}`
			: `./zig-out/native/${platform}/${libname}`;

		// If platform-specific path doesn't exist, try non-platform-specific build output
		// (which is created by the standard build system)
		const fallbackPath = `./zig-out/native/lib${moduleName === "voltaire_native" ? "primitives_ts_native" : moduleName}.${ext}`;

		// Return platform-specific path first (for distribution packages)
		// The loader will handle both paths
		return platformSpecificPath;
	}
}
