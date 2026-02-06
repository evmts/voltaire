// WASM: ripemd160 on bytes
import { ripemd160, bytesToHex } from "@tevm/voltaire/wasm";

(() => {
  const data = new TextEncoder().encode("abc");
  const out = ripemd160(data);
  console.log("ripemd160(abc):", bytesToHex(out));
})();

