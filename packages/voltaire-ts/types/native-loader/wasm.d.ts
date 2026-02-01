/**
 * WASM loader for fork StateManager + Blockchain modules
 * Provides JS-friendly wrappers around Zig C-API exports.
 */
import type { BlockchainFFIExports } from "../blockchain/Blockchain/index.js";
import type { StateManagerFFIExports } from "../state-manager/StateManager/index.js";
export declare function loadForkWasm(options?: {
    stateManagerWasm?: string | URL | ArrayBuffer;
    blockchainWasm?: string | URL | ArrayBuffer;
}): Promise<{
    stateManager: StateManagerFFIExports;
    blockchain: BlockchainFFIExports;
}>;
//# sourceMappingURL=wasm.d.ts.map