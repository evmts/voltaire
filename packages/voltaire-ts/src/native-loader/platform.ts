/**
 * Platform detection and native library path resolution utilities.
 *
 * Resolution order:
 * 1. `process.env.VOLTAIRE_NATIVE_LIB` explicit override
 * 2. Prebuilt platform npm package `@tevm/voltaire-${platform}`
 * 3. Local monorepo build outputs (`zig-out/native/${platform}/`, `zig-out/native/`, `zig-out/lib/`)
 * 4. Actionable `NativeLibraryNotFoundError`
 */

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
	NativeLibraryNotFoundError,
	type NativeRuntimeKind,
	NativeUnsupportedPlatformError,
} from "./types.js";

export type Platform =
	| "darwin-arm64"
	| "darwin-x64"
	| "linux-arm64"
	| "linux-x64"
	| "win32-x64";

export type NativeExtension = "dylib" | "so" | "dll";

export interface NativePathOptions {
	runtime?: NativeRuntimeKind;
	moduleName?: string;
	subpath?: string;
}

const moduleDir = dirname(fileURLToPath(import.meta.url));
const pkgRequire = createRequire(import.meta.url);

/**
 * Get current platform identifier.
 * @throws {NativeUnsupportedPlatformError} When OS or CPU architecture is unsupported
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
		throw new NativeUnsupportedPlatformError(platform, arch);
	}

	const combined = `${mappedPlatform}-${mappedArch}`;
	if (combined === "win32-arm64") {
		throw new NativeUnsupportedPlatformError(platform, arch);
	}

	return combined as Platform;
}

/**
 * Get shared library file extension for the current platform.
 */
export function getNativeExtension(): NativeExtension {
	switch (process.platform) {
		case "darwin":
			return "dylib";
		case "linux":
			return "so";
		case "win32":
			return "dll";
		default:
			throw new NativeUnsupportedPlatformError(process.platform, process.arch);
	}
}

/**
 * Get shared library filename prefix for the current platform ("lib" on POSIX, "" on Windows).
 */
export function getNativeLibPrefix(): "lib" | "" {
	return process.platform === "win32" ? "" : "lib";
}

/**
 * Check if native bindings are supported on the current platform.
 */
export function isNativeSupported(): boolean {
	try {
		getPlatform();
		return true;
	} catch {
		return false;
	}
}

function buildSharedLibFilenames(
	names: readonly string[],
	ext: NativeExtension,
	prefix: "lib" | "",
): string[] {
	const out: string[] = [];
	for (const name of names) {
		out.push(`${prefix}${name}.${ext}`);
		if (prefix === "") {
			out.push(`lib${name}.${ext}`);
		}
	}
	return out;
}

function resolvePlatformPackageDir(platform: Platform): string | null {
	try {
		return dirname(
			pkgRequire.resolve(`@tevm/voltaire-${platform}/package.json`),
		);
	} catch {
		return null;
	}
}

function resolvePlatformPackageCandidates(
	platform: Platform,
	ext: NativeExtension,
	prefix: "lib" | "",
	runtime: NativeRuntimeKind,
	moduleName: string,
	subpath?: string,
): string[] {
	const pkgName = `@tevm/voltaire-${platform}`;
	const nodeFilenames = [
		`${moduleName}.${platform}.node`,
		`voltaire_native.${platform}.node`,
	];
	const sharedNames =
		moduleName === "voltaire_native"
			? ["primitives_ts_native", "voltaire_native", "primitives_c"]
			: [moduleName, "primitives_ts_native", "voltaire_native", "primitives_c"];
	const sharedFilenames = buildSharedLibFilenames(sharedNames, ext, prefix);
	const orderedFiles =
		runtime === "node-api"
			? [...nodeFilenames, ...sharedFilenames]
			: [...sharedFilenames, ...nodeFilenames];

	const results: string[] = [];
	const pkgDir = resolvePlatformPackageDir(platform);

	for (const file of orderedFiles) {
		const rel = subpath ? `${subpath}/${file}` : file;
		if (pkgDir) {
			results.push(join(pkgDir, rel));
		}
		try {
			results.push(pkgRequire.resolve(`${pkgName}/${rel}`));
		} catch {
			// Package or subpath not installed; continue checking remaining candidates.
		}
	}

	return results;
}

function getLocalSearchRoots(): string[] {
	return [
		process.cwd(),
		resolve(moduleDir, "../../../.."),
		resolve(moduleDir, "../../.."),
	];
}

function resolveLocalBuildCandidates(
	platform: Platform,
	ext: NativeExtension,
	prefix: "lib" | "",
	runtime: NativeRuntimeKind,
	moduleName: string,
	subpath?: string,
): string[] {
	const results: string[] = [];
	const sub = subpath ? `${subpath}/` : "";
	const sharedPlatformNames = buildSharedLibFilenames(
		moduleName === "voltaire_native"
			? ["voltaire_native", "primitives_ts_native"]
			: [moduleName, "voltaire_native", "primitives_ts_native"],
		ext,
		prefix,
	);
	const sharedFlatNames = buildSharedLibFilenames(
		moduleName === "voltaire_native"
			? ["primitives_ts_native", "voltaire_native"]
			: [moduleName, "primitives_ts_native", "voltaire_native"],
		ext,
		prefix,
	);
	const libDirNames = buildSharedLibFilenames(
		["primitives_ts_native", "primitives_c"],
		ext,
		prefix,
	);
	const nodeFilename = `${moduleName}.${platform}.node`;

	for (const root of getLocalSearchRoots()) {
		if (runtime === "node-api") {
			results.push(
				join(root, "zig-out", "native", platform, sub, nodeFilename),
			);
			results.push(join(root, "zig-out", "native", sub, nodeFilename));
		}
		for (const file of sharedPlatformNames) {
			results.push(join(root, "zig-out", "native", platform, sub, file));
		}
		for (const file of sharedFlatNames) {
			results.push(join(root, "zig-out", "native", sub, file));
		}
		for (const file of libDirNames) {
			results.push(join(root, "zig-out", "lib", file));
		}
	}

	return results;
}

function dedupePaths(paths: readonly string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const item of paths) {
		const normalized = resolve(item);
		if (!seen.has(normalized)) {
			seen.add(normalized);
			out.push(normalized);
		}
	}
	return out;
}

/**
 * Return the ordered, deduplicated list of native library paths to try.
 *
 * When `VOLTAIRE_NATIVE_LIB` is set, only that explicit override path is returned.
 */
export function getNativeLibCandidates(
	options: NativePathOptions = {},
): string[] {
	const envOverride = process.env.VOLTAIRE_NATIVE_LIB?.trim();
	if (envOverride) {
		return [resolve(envOverride)];
	}

	const platform = getPlatform();
	const ext = getNativeExtension();
	const prefix = getNativeLibPrefix();
	const runtime: NativeRuntimeKind =
		options.runtime ??
		(typeof (globalThis as { Bun?: unknown }).Bun !== "undefined"
			? "bun-ffi"
			: "node-api");
	const moduleName = options.moduleName ?? "voltaire_native";

	const pkgCandidates = resolvePlatformPackageCandidates(
		platform,
		ext,
		prefix,
		runtime,
		moduleName,
		options.subpath,
	);
	const localCandidates = resolveLocalBuildCandidates(
		platform,
		ext,
		prefix,
		runtime,
		moduleName,
		options.subpath,
	);

	return dedupePaths([...pkgCandidates, ...localCandidates]);
}

/**
 * Resolve the first existing native library file on disk.
 * @throws {NativeLibraryNotFoundError} When no candidate exists on disk
 */
export function resolveNativeLibPath(options: NativePathOptions = {}): string {
	const envOverride = process.env.VOLTAIRE_NATIVE_LIB?.trim();
	const platform = isNativeSupported()
		? getPlatform()
		: `${process.platform}-${process.arch}`;

	if (envOverride) {
		const resolved = resolve(envOverride);
		if (existsSync(resolved)) {
			return resolved;
		}
		throw new NativeLibraryNotFoundError(platform, [resolved]);
	}

	const candidates = getNativeLibCandidates(options);
	for (const candidate of candidates) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}

	throw new NativeLibraryNotFoundError(platform, candidates);
}

/**
 * Get the preferred path to the native library file.
 * Returns the first existing candidate if present on disk, otherwise the
 * primary local build candidate path for backward compatibility.
 */
export function getNativeLibPath(
	moduleName = "voltaire_native",
	subpath?: string,
): string {
	const candidates = getNativeLibCandidates({ moduleName, subpath });
	for (const candidate of candidates) {
		if (existsSync(candidate)) {
			return candidate;
		}
	}
	return (
		candidates[0] ?? `./zig-out/native/lib${moduleName}.${getNativeExtension()}`
	);
}
