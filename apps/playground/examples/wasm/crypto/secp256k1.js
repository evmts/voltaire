// WASM: secp256k1 sign/verify/recover
import { keccak256, bytesToHex, Secp256k1Wasm, hexToBytes } from "@tevm/voltaire/wasm";
import { generatePrivateKey } from "@tevm/voltaire/wasm";

(async () => {
  // Message hash
  const msg = new TextEncoder().encode("hello");
  const msgHash = await keccak256(msg);

  // Keys
  const priv = generatePrivateKey();
  const pub = Secp256k1Wasm.derivePublicKey(priv);
  console.log("priv:", bytesToHex(priv));
  console.log("pub:", bytesToHex(pub));

  // Sign
  const sig = Secp256k1Wasm.sign(msgHash, priv);
  console.log("sig.r:", bytesToHex(sig.r));
  console.log("sig.s:", bytesToHex(sig.s));
  console.log("sig.v:", sig.v);

  // Verify
  console.log("verify:", Secp256k1Wasm.verify(sig, msgHash, pub));

  // Recover
  const recPub = Secp256k1Wasm.recoverPublicKey(sig, msgHash);
  console.log("recovered pub == pub:", bytesToHex(recPub) === bytesToHex(pub));
})();

