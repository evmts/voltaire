// WASM: Direct secp256k1 helpers (recover/derive)
import { keccak256, bytesToHex, secp256k1PubkeyFromPrivate, secp256k1RecoverPubkey, secp256k1RecoverAddress, generatePrivateKey } from "voltaire/wasm";

(async () => {
  const msg = new TextEncoder().encode("direct");
  const msgHash = await keccak256(msg);

  const priv = generatePrivateKey();
  const pub = secp256k1PubkeyFromPrivate(priv);
  console.log("pub:", bytesToHex(pub));

  // Fake signature to showcase the api (won't verify)
  const r = new Uint8Array(32); r[31] = 1;
  const s = new Uint8Array(32); s[31] = 2;
  const rec = 1;

  try {
    const recPub = secp256k1RecoverPubkey(msgHash, r, s, rec);
    console.log("recovered pub:", bytesToHex(recPub));
  } catch (e) {
    console.log("recover pub failed (expected with dummy sig):", e?.message || e);
  }

  try {
    const recAddr = secp256k1RecoverAddress(msgHash, r, s, rec);
    console.log("recovered addr:", bytesToHex(recAddr));
  } catch (e) {
    console.log("recover addr failed (expected with dummy sig):", e?.message || e);
  }
})();

