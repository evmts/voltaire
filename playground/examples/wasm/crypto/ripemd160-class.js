// WASM: Ripemd160Wasm namespace usage
import { Ripemd160Wasm, bytesToHex } from "voltaire/wasm";

(() => {
  const data = new TextEncoder().encode("ripemd");
  const out = Ripemd160Wasm.hash(data);
  console.log("Ripemd160Wasm.hash:", bytesToHex(out));
})();

