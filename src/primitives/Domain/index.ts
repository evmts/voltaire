import { from as fromImpl } from "./from.js";
import { toHash as toHashImpl } from "./toHash.js";
import { encodeData as encodeDataImpl } from "./encodeData.js";
import { encodeType as encodeTypeImpl } from "./encodeType.js";
import { encodeValue as encodeValueImpl } from "./encodeValue.js";
import { hashType as hashTypeImpl } from "./hashType.js";
import { getEIP712DomainType as getEIP712DomainTypeImpl } from "./getEIP712DomainType.js";

export type { DomainType } from "./DomainType.js";
export * from "./errors.js";

// Internal exports (prefixed with _)
export { from as _from } from "./from.js";
export { toHash as _toHash } from "./toHash.js";
export { encodeData as _encodeData } from "./encodeData.js";
export { encodeType as _encodeType } from "./encodeType.js";
export { encodeValue as _encodeValue } from "./encodeValue.js";
export { hashType as _hashType } from "./hashType.js";
export { getEIP712DomainType as _getEIP712DomainType } from "./getEIP712DomainType.js";

// Public wrapper functions
export function from(domain: {
	name?: string;
	version?: string;
	chainId?: import("../ChainId/ChainIdType.js").ChainIdType | number;
	verifyingContract?: import("../Address/AddressType.js").AddressType | string;
	salt?: import("../Hash/HashType.js").HashType | string;
}): import("./DomainType.js").DomainType {
	return fromImpl(domain);
}

export function toHash(
	domain: import("./DomainType.js").DomainType,
	crypto: {
		keccak256: (data: Uint8Array) => Uint8Array;
	},
): import("../DomainSeparator/DomainSeparatorType.js").DomainSeparatorType {
	return toHashImpl(domain, crypto);
}

export function encodeData(
	primaryType: string,
	data: any,
	types: object,
	crypto: {
		keccak256: (data: Uint8Array) => Uint8Array;
	},
): Uint8Array {
	return encodeDataImpl(primaryType, data, types, crypto);
}

export function encodeType(primaryType: string, types: object): string {
	return encodeTypeImpl(primaryType, types);
}

export function encodeValue(
	type: string,
	value: any,
	types: object,
	crypto: {
		keccak256: (data: Uint8Array) => Uint8Array;
	},
): Uint8Array {
	return encodeValueImpl(type, value, types, crypto);
}

export function hashType(
	primaryType: string,
	types: object,
	crypto: {
		keccak256: (data: Uint8Array) => Uint8Array;
	},
): Uint8Array {
	return hashTypeImpl(primaryType, types, crypto);
}

export function getEIP712DomainType(
	domain: import("./DomainType.js").DomainType,
): Array<{ name: string; type: string }> {
	return getEIP712DomainTypeImpl(domain);
}
