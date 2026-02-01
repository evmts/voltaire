import type { brand } from "../../brand.js";
/**
 * EncodedData - ABI-encoded hex data
 *
 * Branded hex string representing ABI-encoded data.
 * Can be decoded using ABI specifications.
 */
export type EncodedDataType = `0x${string}` & {
    readonly [brand]: "EncodedData";
};
//# sourceMappingURL=EncodedDataType.d.ts.map