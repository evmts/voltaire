import type { brand } from "../../brand.js";
/**
 * Branded ContractCode type
 * Full deployed contract bytecode including metadata
 */
export type ContractCodeType = Uint8Array & {
    readonly [brand]: "ContractCode";
};
//# sourceMappingURL=ContractCodeType.d.ts.map