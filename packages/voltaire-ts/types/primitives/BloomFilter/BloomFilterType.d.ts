import type { brand } from "../../brand.js";
export type BloomFilterType = Uint8Array & {
    readonly [brand]: "BloomFilter";
    readonly k: number;
    readonly m: number;
    toHex(this: BloomFilterType): string;
};
//# sourceMappingURL=BloomFilterType.d.ts.map