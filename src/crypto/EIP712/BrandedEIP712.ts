import type { brand } from "../../brand.js";
import type { BrandedAddress } from "../../primitives/Address/BrandedAddress/BrandedAddress.js";
import type { BrandedHash } from "../../primitives/Hash/Hash.js";

/**
 * EIP-712 Domain separator fields
 */
export type Domain = {
	name?: string;
	version?: string;
	chainId?: bigint;
	verifyingContract?: BrandedAddress;
	salt?: BrandedHash;
};

/**
 * Type property definition
 */
export type TypeProperty = {
	name: string;
	type: string;
};

/**
 * Type definitions mapping type names to their properties
 */
export type TypeDefinitions = {
	[typeName: string]: readonly TypeProperty[];
};

/**
 * Message value (can be primitive or nested object)
 */
export type MessageValue =
	| string
	| bigint
	| number
	| boolean
	| BrandedAddress
	| Uint8Array
	| MessageValue[]
	| { [key: string]: MessageValue };

/**
 * Message data (object with arbitrary structure matching types)
 */
export type Message = {
	[key: string]: MessageValue;
};

/**
 * Complete EIP-712 typed data structure
 */
export type TypedData = {
	domain: Domain;
	types: TypeDefinitions;
	primaryType: string;
	message: Message;
};

/**
 * ECDSA Signature
 */
export type Signature = {
	r: Uint8Array;
	s: Uint8Array;
	v: number;
};

/**
 * Branded EIP-712 TypedData type
 */
export type BrandedEIP712 = TypedData & {
	readonly [brand]: "EIP712";
};
