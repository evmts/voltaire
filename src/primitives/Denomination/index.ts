// Export wrapper namespaces
export * as Wei from "./Wei.js";
export * as Gwei from "./Gwei.js";
export * as Ether from "./Ether.js";

// Export branded namespaces (flattened)
export * as BrandedWeiNamespace from "./wei-index.js";
export * as BrandedGweiNamespace from "./gwei-index.js";
export * as BrandedEtherNamespace from "./ether-index.js";

// Export type definitions
export type { EtherType, BrandedEther } from "./EtherType.js";
export type { GweiType, BrandedGwei } from "./GweiType.js";
export type { WeiType, BrandedWei } from "./WeiType.js";
