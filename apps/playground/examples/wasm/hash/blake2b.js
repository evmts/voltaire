// WASM: blake2b on bytes
import { blake2b, bytesToHex } from "@tevm/voltaire/wasm";

(() => {
  const data = new TextEncoder().encode("data");
  const out = blake2b(data);
  console.log("blake2b(data):", bytesToHex(out));
})();

