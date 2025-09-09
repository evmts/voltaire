import { readFileSync } from 'fs';
import { join } from 'path';

export interface GuillotineWasmExports {
  memory: WebAssembly.Memory;
  
  // Initialize the EVM
  guillotine_init(): number;
  
  // Cleanup the EVM
  guillotine_deinit(): void;
  
  // Execute bytecode
  guillotine_execute(
    bytecode_ptr: number,
    bytecode_len: number,
    caller_ptr: number,
    value: bigint,
    gas_limit: bigint,
    result_ptr: number
  ): number;
  
  // Check if initialized
  guillotine_is_initialized(): number;
  
  // Get version
  guillotine_version(): number;
  
  // Memory allocation (provided by WASM)
  malloc?(size: number): number;
  free?(ptr: number): void;
}

let wasmInstance: WebAssembly.Instance | null = null;
let wasmExports: GuillotineWasmExports | null = null;

export async function loadWasm(): Promise<GuillotineWasmExports> {
  if (wasmExports) {
    return wasmExports;
  }

  const wasmPath = join(__dirname, 'wasm', 'guillotine.wasm');
  const wasmBuffer = readFileSync(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  
  // Create import object with minimal requirements
  const importObject = {
    env: {
      // Add any required imports here if needed
    }
  };
  
  wasmInstance = await WebAssembly.instantiate(wasmModule, importObject);
  wasmExports = wasmInstance.exports as GuillotineWasmExports;
  
  return wasmExports;
}

export function getWasmExports(): GuillotineWasmExports {
  if (!wasmExports) {
    throw new Error('WASM not loaded. Call loadWasm() first.');
  }
  return wasmExports;
}

export function unloadWasm(): void {
  if (wasmExports && wasmExports.guillotine_is_initialized() > 0) {
    wasmExports.guillotine_deinit();
  }
  wasmInstance = null;
  wasmExports = null;
}