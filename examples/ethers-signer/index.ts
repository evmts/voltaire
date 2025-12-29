/**
 * Ethers v6-compatible Signer implementation using Voltaire primitives
 *
 * @example
 * ```typescript
 * import { EthersSigner } from "./examples/ethers-signer/index.js";
 *
 * const signer = EthersSigner.fromPrivateKey({
 *   privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
 * });
 *
 * const signature = await signer.signMessage("Hello, Ethereum!");
 * ```
 */

export { EthersSigner, default } from "./EthersSigner.js";
export * from "./errors.js";
export type * from "./EthersSignerTypes.js";
