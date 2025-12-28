// WASM: EIP-4844 blob helpers
import { blobFromData, blobToData, blobIsValid, blobEstimateCount, blobCalculateGas, blobCalculateGasPrice, blobCalculateExcessGas } from "@tevm/voltaire/wasm";

(() => {
  // Create a small fake blob from bytes
  const data = new Uint8Array([1, 2, 3, 4, 5]);
  const blob = blobFromData(data);
  console.log("blobIsValid:", blobIsValid(blob));

  // Roundtrip
  const back = blobToData(blob);
  console.log("blob roundtrip length:", back.length);

  // Estimates (using dummy values)
  console.log("blobEstimateCount(1000 bytes):", Number(blobEstimateCount(1000)));
  console.log("blobCalculateGas(1 blob):", Number(blobCalculateGas(1)));
  console.log("blobCalculateGasPrice(excess=0):", Number(blobCalculateGasPrice(0)));
  console.log("blobCalculateExcessGas(excess=0, added=1):", Number(blobCalculateExcessGas(0, 1)));
})();

