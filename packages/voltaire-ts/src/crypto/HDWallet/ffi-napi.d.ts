declare module "ffi-napi" {
	export type FfiArgType = string | object;
	export type FfiFunctionSpec = readonly [FfiArgType, readonly FfiArgType[]];
	export type FfiFunctionMap = Record<string, FfiFunctionSpec>;

	export interface Library {
		hdwallet_generate_mnemonic(
			entropy: Uint8Array,
			entropyLen: number,
			outBuf: Uint8Array,
			outBufLen: number,
		): number;
		hdwallet_mnemonic_to_seed(
			mnemonic: string,
			password: string | null,
			seed: Uint8Array,
		): number;
		hdwallet_validate_mnemonic(mnemonic: string): number;
		hdwallet_from_seed(seed: Uint8Array, seedLen: number): number;
		hdwallet_derive(
			handle: number,
			pathBuf: Uint8Array,
			pathLen: number,
		): number;
		hdwallet_get_private_key(handle: number, outBuf: Uint8Array): number;
		hdwallet_get_public_key(handle: number, outBuf: Uint8Array): number;
		hdwallet_get_address(handle: number, outBuf: Uint8Array): number;
		hdwallet_free(handle: number): number;
	}

	const ffi: {
		Library(libFile: string | null, funcs: FfiFunctionMap): Library;
	};

	export default ffi;
}

declare module "ref-napi" {
	export interface RefType {
		readonly size: number;
		readonly indirection: number;
		readonly name?: string;
	}

	export interface RefTypes {
		readonly void: RefType;
		readonly [key: string]: RefType;
	}

	const ref: {
		readonly types: RefTypes;
		refType(type: RefType | string): RefType;
	};

	export default ref;
}
