// WASM: RLP encode/decode utilities
import { rlpEncodeBytes, rlpEncodeUint, rlpEncodeUintFromBigInt, rlpToHex, rlpFromHex, bytesToHex } from "@tevm/voltaire/wasm";

(() => {
  const enc1 = rlpEncodeBytes(new Uint8Array([0x01, 0x02]));
  const enc2 = rlpEncodeUint(255);
  const enc3 = rlpEncodeUintFromBigInt(1024n);
  console.log("RLP bytes:", bytesToHex(enc1));
  console.log("RLP uint(255):", bytesToHex(enc2));
  console.log("RLP uint(1024n):", bytesToHex(enc3));

  const hex = rlpToHex(enc1);
  const back = rlpFromHex(hex);
  console.log("RLP toHex -> fromHex roundtrip:", hex, bytesToHex(back));
})();

