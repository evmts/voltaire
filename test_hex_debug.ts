import { loadWasm } from "./src/wasm-loader/loader.js";
import * as HexWasm from "./src/primitives/Hex/Hex.wasm.js";

await loadWasm();

try {
  console.log("Testing hexToBytes('0x')");
  const result = HexWasm.hexToBytes("0x");
  console.log("Result:", result);
} catch (e: any) {
  console.log("Error:", e.message);
}

try {
  console.log("\nTesting hexToBytes('0x00')");
  const result = HexWasm.hexToBytes("0x00");
  console.log("Result:", result);
} catch (e: any) {
  console.log("Error:", e.message);
}

try {
  console.log("\nTesting bytesToHex -> hexToBytes with 0x42");
  const bytes = new Uint8Array([0x42]);
  const hex = HexWasm.bytesToHex(bytes);
  console.log("Hex:", hex);
  const back = HexWasm.hexToBytes(hex);
  console.log("Back:", back);
} catch (e: any) {
  console.log("Error:", e.message);
}
