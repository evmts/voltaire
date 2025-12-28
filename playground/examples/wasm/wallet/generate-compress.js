// WASM: Wallet helpers (generate/compress)
import { generatePrivateKey, compressPublicKey, Secp256k1Wasm, bytesToHex } from "voltaire/wasm";

(() => {
  const priv = generatePrivateKey();
  const pub = Secp256k1Wasm.derivePublicKey(priv);
  const compressed = compressPublicKey(pub);
  console.log("priv:", bytesToHex(priv));
  console.log("pub:", bytesToHex(pub));
  console.log("compressed:", bytesToHex(compressed));
})();

