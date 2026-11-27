/**
 * Platform detection and native library path resolution utilities.
 *
 * Resolution order:
 * 1. `process.env.VOLTAIRE_NATIVE_LIB` explicit override
 * 2. Prebuilt platform npm package `@tevm/voltaire-${platform}`
 * 3. Local monorepo build outputs (`zig-out/native/${platform}/`, `zig-out/native/`, `zig-out/lib/`)
 * 4. Actionable `NativeLibraryNotFoundError`
 */
import { type NativeRuntimeKind } from "./types.js";
export type Platform = "darwin-arm64" | "darwin-x64" | "linux-arm64" | "linux-x64" | "win32-x64";
export type NativeExtension = "dylib" | "so" | "dll";
export interface NativePathOptions {
    runtime?: NativeRuntimeKind;
    moduleName?: string;
    subpath?: string;
}
/**
 * Get current platform identifier.
 * @throws {NativeUnsupportedPlatformError} When OS or CPU architecture is unsupported
 */
export declare function getPlatform(): Platform;
/**
 * Get shared library file extension for the current platform.
 */
export declare function getNativeExtension(): NativeExtension;
/**
 * Get shared library filename prefix for the current platform ("lib" on POSIX, "" on Windows).
 */
export declare function getNativeLibPrefix(): "lib" | "";
/**
 * Check if native bindings are supported on the current platform.
 */
export declare function isNativeSupported(): boolean;
/**
 * Return the ordered, deduplicated list of native library paths to try.
 *
 * When `VOLTAIRE_NATIVE_LIB` is set, only that explicit override path is returned.
 */
export declare function getNativeLibCandidates(options?: NativePathOptions): string[];
/**
 * Resolve the first existing native library file on disk.
 * @throws {NativeLibraryNotFoundError} When no candidate exists on disk
 */
export declare function resolveNativeLibPath(options?: NativePathOptions): string;
/**
 * Get the preferred path to the native library file.
 * Returns the first existing candidate if present on disk, otherwise the
 * primary local build candidate path for backward compatibility.
 */
export declare function getNativeLibPath(moduleName?: string, subpath?: string): string;
//# sourceMappingURL=platform.d.ts.map