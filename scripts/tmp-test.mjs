import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadWasm } from "../src/wasm-loader/loader.ts";
const wasmPath = resolve(process.cwd(), "src/wasm-loader/primitives.wasm");
const buf = await readFile(wasmPath);
await loadWasm(buf.buffer);
const Address = await import("../src/primitives/Address/Address.wasm.js");
const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
