/**
 * Branded RLP data type
 */
export type BrandedRlp =
	| { type: "bytes"; value: Uint8Array }
	| { type: "list"; value: BrandedRlp[] };
