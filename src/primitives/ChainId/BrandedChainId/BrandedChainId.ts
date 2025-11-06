/**
 * Branded ChainId type - prevents chain mixing bugs
 * Wraps a number representing an EIP-155 chain ID
 */
export type BrandedChainId = number & { readonly __tag: "ChainId" };
