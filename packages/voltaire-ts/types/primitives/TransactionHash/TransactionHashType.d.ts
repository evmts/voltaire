import type { brand } from "../../brand.js";
/**
 * Transaction hash (32-byte identifier)
 */
export type TransactionHashType = Uint8Array & {
    readonly [brand]: "TransactionHash";
    readonly length: 32;
};
export declare const SIZE = 32;
//# sourceMappingURL=TransactionHashType.d.ts.map