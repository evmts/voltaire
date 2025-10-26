/**
 * WASM implementation of signer utility functions
 */
import type { Signer } from "./private-key-signer.js";
export declare function getAddress(signer: Signer): string;
export declare function recoverTransactionAddress(transaction: any): Promise<string>;
//# sourceMappingURL=utils.d.ts.map