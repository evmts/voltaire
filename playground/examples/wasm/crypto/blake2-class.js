// WASM: Blake2Wasm namespace usage
import { Blake2Wasm, bytesToHex } from "@tevm/voltaire/wasm";

(() => {
  const data = new TextEncoder().encode("class");
  const out = Blake2Wasm.hash(data);
  console.log("Blake2Wasm.hash:", bytesToHex(out));
})();

