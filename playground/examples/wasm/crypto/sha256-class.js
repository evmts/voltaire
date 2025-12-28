// WASM: Sha256Wasm namespace usage
import { Sha256Wasm, bytesToHex } from "@tevm/voltaire/wasm";

(() => {
  const data = new TextEncoder().encode("namespace");
  const out = Sha256Wasm.hash(data);
  console.log("Sha256Wasm.hash:", bytesToHex(out));
})();

