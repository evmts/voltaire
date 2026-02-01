import type { brand } from "../../brand.js";
/**
 * Block hash (32-byte identifier)
 */
export type BlockHashType = Uint8Array & {
    readonly [brand]: "BlockHash";
    readonly length: 32;
};
export declare const SIZE = 32;
//# sourceMappingURL=BlockHashType.d.ts.map