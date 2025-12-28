// WASM: EIP-191 hash message
import { eip191HashMessage, bytesToHex } from "voltaire/wasm";

(async () => {
  const msg = new TextEncoder().encode("Sign me");
  const digest = await eip191HashMessage(msg);
  console.log("eip191HashMessage:", bytesToHex(digest));
})();

