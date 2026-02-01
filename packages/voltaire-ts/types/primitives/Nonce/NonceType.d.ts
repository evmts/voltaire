import type { brand } from "../../brand.js";
/**
 * Branded Nonce type - prevents nonce reuse/confusion
 * Represents a transaction nonce as a branded bigint
 */
export type NonceType = bigint & {
    readonly [brand]: "Nonce";
};
//# sourceMappingURL=NonceType.d.ts.map