// WASM: Detect transaction type
import { detectTransactionType, TransactionType, hexToBytes } from "@tevm/voltaire/wasm";

(() => {
  // Legacy transaction (starts with RLP-encoded list 0xF8...)
  const legacyHex = "0xf86c808504a817c80082520894f39fd6e51aad88f6f4ce6ab8827279cfffb92266980802ba098a7a65b8f80f04252cb7b3b2a644d5ec6b4b54883b081e0b6626900b8f35920a07db618008708d95379dfee4caf9d6b4c85f89edd89905d3c5c13924e394108ab";
  const legacyBytes = hexToBytes(legacyHex);
  console.log("legacy type:", detectTransactionType(legacyBytes) === TransactionType.Legacy);

  // EIP-1559 (0x02 prefix)
  const eip1559 = new Uint8Array([0x02, 0x01, 0x02]);
  console.log("eip-1559 type detected:", detectTransactionType(eip1559) === TransactionType.EIP1559);
})();

