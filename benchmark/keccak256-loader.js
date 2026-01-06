// Minimal loader for individual keccak256.wasm (treeshakable build)
import { readFile } from 'node:fs/promises';

let wasmInstance = null;
let wasmMemory = null;

export async function loadKeccak256Wasm(wasmPath) {
  const wasmBuffer = await readFile(wasmPath);
  const wasmModule = await WebAssembly.compile(wasmBuffer);
  const instance = await WebAssembly.instantiate(wasmModule, {});

  wasmInstance = instance;
  wasmMemory = instance.exports.memory;
}

export function keccak256(data) {
  if (!wasmInstance) throw new Error('WASM not loaded');

  const memory = new Uint8Array(wasmMemory.buffer);
  const inputPtr = 0;
  const outputPtr = data.length;

  // Write input
  memory.set(data, inputPtr);

  // Call hash function
  wasmInstance.exports.keccak256Hash(inputPtr, data.length, outputPtr);

  // Read output (32 bytes)
  return memory.slice(outputPtr, outputPtr + 32);
}
