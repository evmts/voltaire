/**
 * Platform detection utilities for native bindings
 */
export type Platform = "darwin-arm64" | "darwin-x64" | "linux-arm64" | "linux-x64" | "win32-x64";
/**
 * Get current platform identifier
 */
export declare function getPlatform(): Platform;
/**
 * Get file extension for native libraries on current platform
 */
export declare function getNativeExtension(): string;
/**
 * Check if native bindings are supported on current platform
 */
export declare function isNativeSupported(): boolean;
/**
 * Get path to native library file
 * @param moduleName - Name of the module (default: 'voltaire_native')
 * @param subpath - Optional subpath (e.g., 'crypto')
 */
export declare function getNativeLibPath(moduleName?: string, subpath?: string): string;
//# sourceMappingURL=platform.d.ts.map