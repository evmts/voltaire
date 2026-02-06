import type { BloomFilterType } from "./BloomFilterType.js";
export type { BloomFilterType } from "./BloomFilterType.js";
export * from "./constants.js";
export * from "./errors.js";
export declare function add(filter: BloomFilterType, item: Uint8Array): void;
export declare function combine(...filters: BloomFilterType[]): BloomFilterType;
export declare function contains(filter: BloomFilterType, item: Uint8Array): boolean;
export declare function create(m: number, k: number): BloomFilterType;
export declare function density(filter: BloomFilterType): number;
export declare function expectedFalsePositiveRate(filter: BloomFilterType, itemCount: number): number;
export declare function fromHex(hex: string, m: number, k: number): BloomFilterType;
export declare function hash(item: Uint8Array, seed: number, m: number): number;
export declare function hashFromKeccak(keccakHash: Uint8Array, seed: number, m: number): number;
export declare function isEmpty(filter: BloomFilterType): boolean;
export declare function merge(filter1: BloomFilterType, filter2: BloomFilterType): BloomFilterType;
export declare function toHex(filter: BloomFilterType): string;
/**
 * Factory function for creating BloomFilter instances
 */
export declare function BloomFilter(m: number, k: number): BloomFilterType;
export declare namespace BloomFilter {
    var create: (m: number, k: number) => BloomFilterType;
    var fromHex: (value: string, m: number, k: number) => BloomFilterType;
    var add: typeof import("./index.js").add;
    var contains: typeof import("./index.js").contains;
    var merge: (a: BloomFilterType, b: BloomFilterType) => BloomFilterType;
    var combine: (...filters: BloomFilterType[]) => BloomFilterType;
    var toHex: typeof import("./index.js").toHex;
    var isEmpty: typeof import("./index.js").isEmpty;
    var hash: typeof import("./index.js").hash;
    var density: typeof import("./index.js").density;
    var expectedFalsePositiveRate: typeof import("./index.js").expectedFalsePositiveRate;
}
//# sourceMappingURL=index.d.ts.map