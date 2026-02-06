// WASM: keccak256 on string input
import { keccak256, bytesToHex } from "@tevm/voltaire/wasm";

(async () => {
  const hash = await keccak256("Hello, Voltaire!");
  console.log("keccak256(\"Hello, Voltaire!\"):", bytesToHex(hash));
})();

