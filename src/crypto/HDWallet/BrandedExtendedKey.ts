import type { HDKey } from "@scure/bip32";

export type Path = string;
export type Seed = Uint8Array;
export type PrivateKey = Uint8Array | null;
export type PublicKey = Uint8Array | null;
export type ChainCode = Uint8Array | null;

export type BrandedExtendedKey = HDKey & {
	readonly __tag: "ExtendedKey";
	derivePath(this: BrandedExtendedKey, path: Path): BrandedExtendedKey;
	deriveChild(this: BrandedExtendedKey, index: number): BrandedExtendedKey;
	toExtendedPrivateKey(this: BrandedExtendedKey): string;
	toExtendedPublicKey(this: BrandedExtendedKey): string;
	getPrivateKey(this: BrandedExtendedKey): PrivateKey;
	getPublicKey(this: BrandedExtendedKey): PublicKey;
	getChainCode(this: BrandedExtendedKey): ChainCode;
	canDeriveHardened(this: BrandedExtendedKey): boolean;
	toPublic(this: BrandedExtendedKey): BrandedExtendedKey;
	calculateCreateAddress(nonce: bigint): Uint8Array;
	calculateCreate2Address(salt: Uint8Array, initCode: Uint8Array): Uint8Array;
};
