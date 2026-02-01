import type { HDKey } from "@scure/bip32";
import type { brand } from "../../brand.js";

export type Path = string;
export type Seed = Uint8Array;
export type PrivateKey = Uint8Array | null;
export type PublicKey = Uint8Array | null;
export type ChainCode = Uint8Array | null;

export type ExtendedKeyType = HDKey & {
	readonly [brand]: "ExtendedKey";
	derivePath(this: ExtendedKeyType, path: Path): ExtendedKeyType;
	deriveChild(this: ExtendedKeyType, index: number): ExtendedKeyType;
	toExtendedPrivateKey(this: ExtendedKeyType): string;
	toExtendedPublicKey(this: ExtendedKeyType): string;
	getPrivateKey(this: ExtendedKeyType): PrivateKey;
	getPublicKey(this: ExtendedKeyType): PublicKey;
	getChainCode(this: ExtendedKeyType): ChainCode;
	canDeriveHardened(this: ExtendedKeyType): boolean;
	toPublic(this: ExtendedKeyType): ExtendedKeyType;
	calculateCreateAddress(nonce: bigint): Uint8Array;
	calculateCreate2Address(salt: Uint8Array, initCode: Uint8Array): Uint8Array;
};

// Backward compatibility alias
export type BrandedExtendedKey = ExtendedKeyType;
