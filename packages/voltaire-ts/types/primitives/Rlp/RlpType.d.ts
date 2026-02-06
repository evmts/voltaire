/**
 * Branded RLP data type
 */
export type BrandedRlp = {
    type: "bytes";
    value: Uint8Array;
} | {
    type: "list";
    value: BrandedRlp[];
};
/**
 * Type that can be RLP-encoded
 */
export type Encodable = Uint8Array | BrandedRlp | Encodable[];
//# sourceMappingURL=RlpType.d.ts.map