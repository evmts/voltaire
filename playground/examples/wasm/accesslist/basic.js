// WASM: Access List helpers (EIP-2930)
import { accessListGasCost, accessListGasSavings, accessListIncludesAddress, accessListIncludesStorageKey, hexToBytes } from "@tevm/voltaire/wasm";

(() => {
  const addr = hexToBytes("0x0000000000000000000000000000000000000001");
  const slot = hexToBytes("0x0000000000000000000000000000000000000000000000000000000000000000");

  const accessList = [
    { address: addr, storageKeys: [slot] },
  ];

  console.log("accessListGasCost:", Number(accessListGasCost(accessList)));
  console.log("accessListGasSavings:", Number(accessListGasSavings(accessList)));
  console.log("includesAddress:", accessListIncludesAddress(accessList, addr));
  console.log("includesStorageKey:", accessListIncludesStorageKey(accessList, addr, slot));
})();

