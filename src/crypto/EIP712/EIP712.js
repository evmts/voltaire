// @ts-nocheck
export * from "./errors.js";
export * from "./BrandedEIP712.js";
import { hash as domainHash } from "./Domain/hash.js";

import { encodeData } from "./encodeData.js";
import { encodeType } from "./encodeType.js";
import { encodeValue } from "./encodeValue.js";
import { format } from "./format.js";
import { hashStruct } from "./hashStruct.js";
import { hashType } from "./hashType.js";
import { hashTypedData } from "./hashTypedData.js";
import { recoverAddress } from "./recoverAddress.js";
import { signTypedData } from "./signTypedData.js";
import { validate } from "./validate.js";
import { verifyTypedData } from "./verifyTypedData.js";

// Export individual functions
export {
	encodeType,
	hashType,
	encodeValue,
	encodeData,
	hashStruct,
	hashTypedData,
	signTypedData,
	recoverAddress,
	verifyTypedData,
	format,
	validate,
};

/**
 * @typedef {import('./BrandedEIP712.js').TypedData} TypedData
 * @typedef {import('./BrandedEIP712.js').Domain} Domain
 * @typedef {import('./BrandedEIP712.js').TypeProperty} TypeProperty
 * @typedef {import('./BrandedEIP712.js').TypeDefinitions} TypeDefinitions
 * @typedef {import('./BrandedEIP712.js').Message} Message
 * @typedef {import('./BrandedEIP712.js').MessageValue} MessageValue
 * @typedef {import('./BrandedEIP712.js').Signature} Signature
 * @typedef {import('./BrandedEIP712.js').BrandedEIP712} BrandedEIP712
 */

/**
 * EIP-712 Typed Data Signing
 *
 * Complete implementation of EIP-712 typed structured data hashing and signing.
 *
 * @example
 * ```typescript
 * import { EIP712 } from './EIP712.js';
 *
 * // Define typed data
 * const typedData = {
 *   domain: {
 *     name: 'MyApp',
 *     version: '1',
 *     chainId: 1n,
 *     verifyingContract: contractAddress,
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: { name: 'Alice', wallet: '0x...' },
 *     to: { name: 'Bob', wallet: '0x...' },
 *     contents: 'Hello!',
 *   },
 * };
 *
 * // Hash typed data
 * const hash = EIP712.hashTypedData(typedData);
 *
 * // Sign typed data
 * const signature = EIP712.signTypedData(typedData, privateKey);
 *
 * // Verify signature
 * const valid = EIP712.verifyTypedData(signature, typedData, address);
 * ```
 */
export const EIP712 = {
	Domain: {
		hash: domainHash,
	},
	encodeType,
	hashType,
	encodeValue,
	encodeData,
	hashStruct,
	hashTypedData,
	signTypedData,
	recoverAddress,
	verifyTypedData,
	format,
	validate,
};
