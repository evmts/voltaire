// WASM: X25519 shared secret
import { X25519Wasm, bytesToHex } from "@tevm/voltaire/wasm";

(() => {
  const alicePriv = X25519Wasm.generatePrivateKey();
  const alicePub = X25519Wasm.scalarMultiplyBase(alicePriv);

  const bobPriv = X25519Wasm.generatePrivateKey();
  const bobPub = X25519Wasm.scalarMultiplyBase(bobPriv);

  const aliceShared = X25519Wasm.scalarMultiply(alicePriv, bobPub);
  const bobShared = X25519Wasm.scalarMultiply(bobPriv, alicePub);

  console.log("shared equal:", bytesToHex(aliceShared) === bytesToHex(bobShared));
})();

