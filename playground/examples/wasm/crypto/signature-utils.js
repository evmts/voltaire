// WASM: signature utilities (parse/serialize/normalize/validate)
import { signatureParse, signatureSerialize, signatureNormalize, secp256k1ValidateSignature, bytesToHex } from "voltaire/wasm";

(() => {
  // Example 64-byte (r||s) signature (dummy data) and recovery bit
  const sigBytes = new Uint8Array(64);
  for (let i = 0; i < 64; i++) sigBytes[i] = i + 1;
  const recovery = 1; // example

  const parsed = signatureParse(sigBytes, recovery);
  console.log("parsed.r:", bytesToHex(parsed.r));
  console.log("parsed.s:", bytesToHex(parsed.s));
  console.log("parsed.v:", parsed.v);

  const serialized = signatureSerialize(parsed);
  console.log("serialized length:", serialized.length);

  console.log("canonical:", signatureNormalize(parsed).v === parsed.v);

  // Validate a dummy signature (will likely be false)
  console.log("validateSignature:", secp256k1ValidateSignature(parsed));
})();

