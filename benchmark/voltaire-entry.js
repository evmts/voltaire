// Import the keccak256 WASM module from source (esbuild compiles .ts)
import { Keccak256Wasm } from '../src/crypto/keccak256.wasm.ts';

// Init WASM then export hash function
await Keccak256Wasm.init();
export const keccak256 = Keccak256Wasm.hash;
