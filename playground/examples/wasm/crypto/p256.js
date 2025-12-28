// WASM: P256 (secp256r1) basic sign/verify
import { P256Wasm, sha256, bytesToHex } from "@tevm/voltaire/wasm";

(() => {
  const priv = P256Wasm.generatePrivateKey();
  const pub = P256Wasm.derivePublicKey(priv);
  const msg = new TextEncoder().encode("p256");
  const hash = sha256(msg);
  const sig = P256Wasm.sign(hash, priv);
  console.log("pub:", bytesToHex(pub));
  console.log("sig.r:", bytesToHex(sig.r));
  console.log("sig.s:", bytesToHex(sig.s));
  console.log("verify:", P256Wasm.verify(sig, hash, pub));
})();

