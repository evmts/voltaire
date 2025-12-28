// WASM: Ed25519 sign/verify
import { Ed25519Wasm, bytesToHex } from "voltaire/wasm";

(() => {
  const priv = Ed25519Wasm.generatePrivateKey();
  const pub = Ed25519Wasm.derivePublicKey(priv);
  const msg = new TextEncoder().encode("ed25519");
  const sig = Ed25519Wasm.sign(msg, priv);
  console.log("pub:", bytesToHex(pub));
  console.log("sig:", bytesToHex(sig));
  console.log("verify:", Ed25519Wasm.verify(msg, sig, pub));
})();

