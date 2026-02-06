export type { UncleType } from "./UncleType.js";
import { from as _from } from "./from.js";
export { _from };
export declare function from(params: {
    parentHash: import("../BlockHash/BlockHashType.js").BlockHashType | string;
    ommersHash: import("../Hash/HashType.js").HashType | string;
    beneficiary: import("../Address/AddressType.js").AddressType | string;
    stateRoot: import("../Hash/HashType.js").HashType | string;
    transactionsRoot: import("../Hash/HashType.js").HashType | string;
    receiptsRoot: import("../Hash/HashType.js").HashType | string;
    logsBloom: Uint8Array;
    difficulty: bigint | number | string;
    number: bigint | number;
    gasLimit: bigint | number | string;
    gasUsed: bigint | number | string;
    timestamp: bigint | number | string;
    extraData: Uint8Array;
    mixHash: import("../Hash/HashType.js").HashType | string;
    nonce: Uint8Array;
}): import("./UncleType.js").UncleType;
export declare const Uncle: {
    from: typeof from;
};
//# sourceMappingURL=index.d.ts.map