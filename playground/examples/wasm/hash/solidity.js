// WASM: Solidity-style hashing (tightly packed data, already packed)
import { solidityKeccak256, soliditySha256, bytesToHex } from "voltaire/wasm";

(() => {
  // Dummy tightly-packed data (already ABI-encoded if needed).
  const packed = new Uint8Array([1, 2, 3, 4]);
  const keccak = solidityKeccak256(packed);
  const sha = soliditySha256(packed);
  console.log("solidityKeccak256([1,2,3,4]):", bytesToHex(keccak));
  console.log("soliditySha256([1,2,3,4]):", bytesToHex(sha));
})();

