export type BrandedHash = Uint8Array & {
	readonly __tag: "Hash";
};

export const SIZE = 32;
