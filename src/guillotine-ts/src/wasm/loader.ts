import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * WASM module interface - represents the exported functions from Zig
 */
export interface GuillotineWasm {
  // Memory management
  memory: WebAssembly.Memory;
  
  // Core functions
  guillotine_init(): number;
  guillotine_deinit(): void;
  guillotine_is_initialized(): number;
  guillotine_version(): number; // Returns pointer to string
  
  // VM management
  guillotine_vm_create(): number; // Returns pointer to VM
  guillotine_vm_destroy(vm: number): void;
  
  // Execution
  guillotine_vm_execute(
    vm: number,
    bytecode_ptr: number,
    bytecode_len: number,
    caller_ptr: number,
    to_ptr: number,
    value_ptr: number,
    input_ptr: number,
    input_len: number,
    gas_limit: bigint
  ): number; // Returns pointer to result
  
  // State management
  guillotine_set_balance(vm: number, address_ptr: number, balance_ptr: number): number;
  guillotine_set_code(vm: number, address_ptr: number, code_ptr: number, code_len: number): number;
  guillotine_set_storage(vm: number, address_ptr: number, key_ptr: number, value_ptr: number): number;
  guillotine_get_balance(vm: number, address_ptr: number): number; // Returns pointer to U256
  guillotine_get_code(vm: number, address_ptr: number): number; // Returns pointer to bytes
  guillotine_get_storage(vm: number, address_ptr: number, key_ptr: number): number; // Returns pointer to U256
  
  // Utility functions
  guillotine_address_from_hex(hex_ptr: number): number;
  guillotine_address_to_hex(address_ptr: number): number;
  guillotine_u256_from_hex(hex_ptr: number): number;
  guillotine_u256_to_hex(u256_ptr: number): number;
  guillotine_hash_from_hex(hex_ptr: number): number;
  guillotine_hash_to_hex(hash_ptr: number): number;
  
  // Memory allocation
  __wbindgen_malloc(size: number): number;
  __wbindgen_free(ptr: number, size: number): void;
}

/**
 * WASM memory helper for reading/writing data
 */
export class WasmMemory {
  private memory: WebAssembly.Memory;
  private wasm: GuillotineWasm;

  constructor(memory: WebAssembly.Memory, wasm: GuillotineWasm) {
    this.memory = memory;
    this.wasm = wasm;
  }

  /**
   * Get a view of the memory buffer
   */
  getBuffer(): Uint8Array {
    return new Uint8Array(this.memory.buffer);
  }

  /**
   * Allocate memory in WASM
   */
  malloc(size: number): number {
    return this.wasm.__wbindgen_malloc(size);
  }

  /**
   * Free memory in WASM
   */
  free(ptr: number, size: number): void {
    this.wasm.__wbindgen_free(ptr, size);
  }

  /**
   * Write bytes to WASM memory
   */
  writeBytes(data: Uint8Array): number {
    const ptr = this.malloc(data.length);
    const buffer = this.getBuffer();
    buffer.set(data, ptr);
    return ptr;
  }

  /**
   * Read bytes from WASM memory
   */
  readBytes(ptr: number, len: number): Uint8Array {
    const buffer = this.getBuffer();
    return buffer.slice(ptr, ptr + len);
  }

  /**
   * Write a null-terminated string to WASM memory
   */
  writeString(str: string): number {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str + '\\0');
    return this.writeBytes(bytes);
  }

  /**
   * Read a null-terminated string from WASM memory
   */
  readString(ptr: number): string {
    const buffer = this.getBuffer();
    let len = 0;
    while (buffer[ptr + len] !== 0 && ptr + len < buffer.length) {
      len++;
    }
    const decoder = new TextDecoder();
    return decoder.decode(buffer.slice(ptr, ptr + len));
  }

  /**
   * Write an address (20 bytes) to WASM memory
   */
  writeAddress(address: Uint8Array): number {
    if (address.length !== 20) {
      throw new Error('Address must be 20 bytes');
    }
    return this.writeBytes(address);
  }

  /**
   * Read an address (20 bytes) from WASM memory
   */
  readAddress(ptr: number): Uint8Array {
    return this.readBytes(ptr, 20);
  }

  /**
   * Write a U256 (32 bytes) to WASM memory
   */
  writeU256(value: Uint8Array): number {
    if (value.length !== 32) {
      throw new Error('U256 must be 32 bytes');
    }
    return this.writeBytes(value);
  }

  /**
   * Read a U256 (32 bytes) from WASM memory
   */
  readU256(ptr: number): Uint8Array {
    return this.readBytes(ptr, 32);
  }

  /**
   * Write a hash (32 bytes) to WASM memory
   */
  writeHash(hash: Uint8Array): number {
    if (hash.length !== 32) {
      throw new Error('Hash must be 32 bytes');
    }
    return this.writeBytes(hash);
  }

  /**
   * Read a hash (32 bytes) from WASM memory
   */
  readHash(ptr: number): Uint8Array {
    return this.readBytes(ptr, 32);
  }
}

/**
 * WASM loader with support for Node.js and browser environments
 */
export class WasmLoader {
  private wasmModule: GuillotineWasm | null = null;
  private memory: WasmMemory | null = null;

  /**
   * Load the WASM module
   */
  async load(wasmPath?: string): Promise<void> {
    let wasmBinary: Uint8Array;

    if (typeof window !== 'undefined') {
      // Browser environment
      const wasmUrl = wasmPath || '/wasm/guillotine.wasm';
      const response = await fetch(wasmUrl);
      wasmBinary = new Uint8Array(await response.arrayBuffer());
    } else {
      // Node.js environment
      const fs = await import('fs');
      const path = await import('path');
      const defaultPath = path.join(__dirname, '../../wasm/guillotine.wasm');
      const finalPath = wasmPath || defaultPath;
      wasmBinary = new Uint8Array(fs.readFileSync(finalPath));
    }

    // Compile and instantiate the WASM module
    const wasmModule = await WebAssembly.instantiate(wasmBinary, {
      env: {
        // Provide any environment functions needed by WASM
        console_log: this.consoleLog.bind(this),
        console_warn: this.consoleWarn.bind(this),
        console_error: this.consoleError.bind(this),
      },
    });

    this.wasmModule = wasmModule.instance.exports as GuillotineWasm;
    this.memory = new WasmMemory(this.wasmModule.memory, this.wasmModule);

    // Initialize the EVM
    const result = this.wasmModule.guillotine_init();
    if (result !== 0) {
      throw new Error('Failed to initialize Guillotine EVM');
    }
  }

  /**
   * Get the WASM module
   */
  getWasm(): GuillotineWasm {
    if (!this.wasmModule) {
      throw new Error('WASM module not loaded. Call load() first.');
    }
    return this.wasmModule;
  }

  /**
   * Get the memory helper
   */
  getMemory(): WasmMemory {
    if (!this.memory) {
      throw new Error('WASM module not loaded. Call load() first.');
    }
    return this.memory;
  }

  /**
   * Check if the module is loaded
   */
  isLoaded(): boolean {
    return this.wasmModule !== null;
  }

  /**
   * Cleanup the WASM module
   */
  cleanup(): void {
    if (this.wasmModule) {
      this.wasmModule.guillotine_deinit();
      this.wasmModule = null;
      this.memory = null;
    }
  }

  // Console logging functions for WASM
  private consoleLog(ptr: number, len: number): void {
    if (this.memory) {
      const message = new TextDecoder().decode(this.memory.readBytes(ptr, len));
      console.log(message);
    }
  }

  private consoleWarn(ptr: number, len: number): void {
    if (this.memory) {
      const message = new TextDecoder().decode(this.memory.readBytes(ptr, len));
      console.warn(message);
    }
  }

  private consoleError(ptr: number, len: number): void {
    if (this.memory) {
      const message = new TextDecoder().decode(this.memory.readBytes(ptr, len));
      console.error(message);
    }
  }
}

// Global WASM loader instance
let globalLoader: WasmLoader | null = null;

/**
 * Get or create the global WASM loader instance
 */
export function getWasmLoader(): WasmLoader {
  if (!globalLoader) {
    globalLoader = new WasmLoader();
  }
  return globalLoader;
}

/**
 * Initialize the global WASM loader
 */
export async function initWasm(wasmPath?: string): Promise<void> {
  const loader = getWasmLoader();
  if (!loader.isLoaded()) {
    await loader.load(wasmPath);
  }
}