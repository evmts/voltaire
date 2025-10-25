/**
 * Runtime environment detection and unified loader
 *
 * Automatically selects between WASM and native FFI based on:
 * - Environment capabilities (browser vs Node.js)
 * - User preferences
 * - Platform support
 */

import type { LoadedWasm, WasmLoaderConfig } from './loader-wasm.ts';
import type { LoadedNative, NativeLoaderConfig } from './loader-native.ts';

/**
 * Runtime environment types
 */
export enum RuntimeEnvironment {
  /** Browser environment - WASM only */
  BROWSER = 'browser',
  /** Node.js with native FFI support */
  NODE_NATIVE = 'node-native',
  /** Node.js with WASM support */
  NODE_WASM = 'node-wasm',
  /** Bun runtime - WASM preferred */
  BUN = 'bun',
  /** Deno runtime - WASM preferred */
  DENO = 'deno',
  /** Unknown/unsupported environment */
  UNKNOWN = 'unknown',
}

/**
 * Runtime loader preference
 */
export enum LoaderPreference {
  /** Prefer native FFI (faster, Node.js only) */
  NATIVE = 'native',
  /** Prefer WebAssembly (portable) */
  WASM = 'wasm',
  /** Auto-detect best option */
  AUTO = 'auto',
}

/**
 * Unified runtime interface
 * Abstracts WASM vs FFI differences
 */
export interface Runtime {
  /** Runtime environment type */
  environment: RuntimeEnvironment;
  /** Loader type actually used */
  loader: 'wasm' | 'native';
  /** WASM instance (if using WASM) */
  wasm?: LoadedWasm;
  /** Native FFI instance (if using native) */
  native?: LoadedNative;
}

/**
 * Runtime initialization configuration
 */
export interface RuntimeConfig {
  /**
   * Loader preference
   * Default: AUTO (prefer native on Node.js, WASM elsewhere)
   */
  preference?: LoaderPreference;

  /**
   * WASM-specific configuration
   */
  wasm?: WasmLoaderConfig;

  /**
   * Native FFI-specific configuration
   */
  native?: NativeLoaderConfig;

  /**
   * Suppress console logging
   */
  silent?: boolean;
}

/**
 * Detect current runtime environment
 *
 * @returns Detected runtime environment
 */
export function detectEnvironment(): RuntimeEnvironment {
  // Browser detection (most restrictive first)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return RuntimeEnvironment.BROWSER;
  }

  // Deno detection
  if (typeof Deno !== 'undefined') {
    return RuntimeEnvironment.DENO;
  }

  // Bun detection
  if (typeof Bun !== 'undefined') {
    return RuntimeEnvironment.BUN;
  }

  // Node.js detection
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    // Check if FFI is available
    try {
      // Don't actually import, just check if it would work
      const hasFFI = typeof require !== 'undefined';
      return hasFFI ? RuntimeEnvironment.NODE_NATIVE : RuntimeEnvironment.NODE_WASM;
    } catch {
      return RuntimeEnvironment.NODE_WASM;
    }
  }

  return RuntimeEnvironment.UNKNOWN;
}

/**
 * Check if native FFI is available
 *
 * @returns true if FFI can be used
 */
export function isNativeAvailable(): boolean {
  const env = detectEnvironment();
  return env === RuntimeEnvironment.NODE_NATIVE;
}

/**
 * Check if WebAssembly is available
 *
 * @returns true if WASM can be used
 */
export function isWasmAvailable(): boolean {
  return typeof WebAssembly !== 'undefined';
}

/**
 * Determine which loader to use based on environment and preference
 *
 * @param preference User preference
 * @returns Loader type to use
 */
export function selectLoader(preference: LoaderPreference = LoaderPreference.AUTO): 'wasm' | 'native' {
  // If explicit preference, try to honor it
  if (preference === LoaderPreference.NATIVE) {
    if (!isNativeAvailable()) {
      throw new Error('Native FFI requested but not available in this environment');
    }
    return 'native';
  }

  if (preference === LoaderPreference.WASM) {
    if (!isWasmAvailable()) {
      throw new Error('WebAssembly requested but not available in this environment');
    }
    return 'wasm';
  }

  // AUTO: prefer native on Node.js, WASM elsewhere
  const env = detectEnvironment();

  switch (env) {
    case RuntimeEnvironment.NODE_NATIVE:
      return 'native';
    case RuntimeEnvironment.NODE_WASM:
    case RuntimeEnvironment.BUN:
    case RuntimeEnvironment.DENO:
    case RuntimeEnvironment.BROWSER:
      return 'wasm';
    default:
      // Fallback to WASM if available
      if (isWasmAvailable()) {
        return 'wasm';
      }
      throw new Error('No compatible loader available in this environment');
  }
}

/**
 * Initialize runtime with automatic loader selection
 *
 * @param config Runtime configuration
 * @returns Initialized runtime
 *
 * @example
 * ```ts
 * // Auto-detect and initialize
 * const runtime = await initRuntime({
 *   wasm: { wasmPath: './primitives.wasm' },
 *   native: { libraryPath: './libprimitives_c.dylib' }
 * });
 * ```
 */
export async function initRuntime(config: RuntimeConfig = {}): Promise<Runtime> {
  const environment = detectEnvironment();
  const loaderType = selectLoader(config.preference);

  if (!config.silent) {
    console.log(`[primitives] Runtime: ${environment}, Loader: ${loaderType}`);
  }

  if (loaderType === 'wasm') {
    // Load WASM
    if (!config.wasm) {
      throw new Error('WASM configuration required but not provided');
    }

    const { loadWasm } = await import('./loader-wasm.ts');
    const wasm = await loadWasm(config.wasm);

    return {
      environment,
      loader: 'wasm',
      wasm,
    };
  } else {
    // Load native FFI
    const { loadNative } = await import('./loader-native.ts');
    const native = await loadNative(config.native);

    return {
      environment,
      loader: 'native',
      native,
    };
  }
}

/**
 * Global runtime instance (singleton)
 */
let runtimeInstance: Runtime | null = null;

/**
 * Get or initialize global runtime
 *
 * @param config Optional configuration for first initialization
 * @returns Runtime instance
 */
export async function getRuntime(config?: RuntimeConfig): Promise<Runtime> {
  if (!runtimeInstance) {
    if (!config) {
      throw new Error('Runtime not initialized. Provide config on first call.');
    }
    runtimeInstance = await initRuntime(config);
  }
  return runtimeInstance;
}

/**
 * Reset runtime instance (for testing)
 */
export function resetRuntime(): void {
  runtimeInstance = null;
}

/**
 * Get runtime information without initializing
 *
 * @returns Runtime environment info
 */
export function getRuntimeInfo() {
  return {
    environment: detectEnvironment(),
    nativeAvailable: isNativeAvailable(),
    wasmAvailable: isWasmAvailable(),
    recommended: selectLoader(LoaderPreference.AUTO),
  };
}
