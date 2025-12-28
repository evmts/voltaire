// WASM: hexToBytes <-> bytesToHex
import { hexToBytes, bytesToHex } from "@tevm/voltaire/wasm";

(() => {
  const hex = "0xdeadbeef";
  const bytes = hexToBytes(hex);
  const roundtrip = bytesToHex(bytes);
  console.log(hex, "->", bytes, "->", roundtrip);
})();

