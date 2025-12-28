// WASM: sha256 on bytes
import { sha256, bytesToHex } from "voltaire/wasm";

(() => {
  const data = new TextEncoder().encode("abc");
  const digest = sha256(data);
  console.log("sha256(abc):", bytesToHex(digest));
})();

