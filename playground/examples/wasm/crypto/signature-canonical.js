// WASM: signatureIsCanonical example
import { signatureParse, signatureIsCanonical } from "voltaire/wasm";

(() => {
  // Dummy signature (r||s)
  const sigBytes = new Uint8Array(64);
  const parsed = signatureParse(sigBytes, 0);
  console.log("isCanonical:", signatureIsCanonical(parsed));
})();

