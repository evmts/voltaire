export function ToProof({ computeBlobKzgProof, }: {
    computeBlobKzgProof: (blob: Uint8Array, commitment: Uint8Array) => Uint8Array;
}): (blob: import("./BlobType.js").BrandedBlob, commitment: import("./BlobType.js").Commitment) => Uint8Array<ArrayBufferLike>;
//# sourceMappingURL=toProof.d.ts.map