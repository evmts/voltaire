import {
	InvalidFormatError,
	InvalidLengthError,
	InvalidTransactionTypeError,
} from "../errors/index.js";
import { parseHexByte } from "../Hex/parseHexByte.js";
import { Type } from "./types.js";

const DOCS = "/primitives/transaction/from-rpc#error-handling";
const HEX_PATTERN = /^(?:0x)?[0-9a-fA-F]*$/;
const QUANTITY_PATTERN = /^0x[0-9a-fA-F]+$/;

/**
 * @param {string} field
 * @param {unknown} value
 * @param {string} expected
 * @returns {InvalidFormatError}
 */
function invalidField(field, value, expected) {
	return new InvalidFormatError(
		value === undefined || value === null
			? `Missing required transaction field: ${field}`
			: `Invalid transaction field ${field}: expected ${expected}`,
		{
			code: -32602,
			value,
			expected,
			context: { field },
			docsPath: DOCS,
		},
	);
}

/**
 * Read a required hex quantity field (`0x` followed by hex digits)
 * @param {string} field
 * @param {unknown} value
 * @returns {bigint}
 * @throws {InvalidFormatError} If the field is missing or not a hex quantity
 */
function requireQuantity(field, value) {
	if (typeof value !== "string" || !QUANTITY_PATTERN.test(value)) {
		throw invalidField(field, value, "hex quantity string");
	}
	return BigInt(value);
}

/**
 * Read a required hex data field
 * @param {string} field
 * @param {unknown} value
 * @returns {Uint8Array}
 * @throws {InvalidFormatError} If the field is missing or not hex data
 */
function requireData(field, value) {
	if (typeof value !== "string" || !HEX_PATTERN.test(value)) {
		throw invalidField(field, value, "hex data string");
	}
	return fromHex(value);
}

/**
 * Read a required signature scalar and left-pad it to 32 bytes
 * @param {string} field
 * @param {unknown} value
 * @returns {Uint8Array}
 * @throws {InvalidFormatError} If the field is missing or not hex
 * @throws {InvalidLengthError} If the scalar is longer than 32 bytes
 */
function requireScalar(field, value) {
	if (typeof value !== "string" || !QUANTITY_PATTERN.test(value)) {
		throw invalidField(field, value, "hex quantity string");
	}
	const bytes = fromHex(value);
	if (bytes.length > 32) {
		throw new InvalidLengthError(
			`Invalid ${field} length: ${bytes.length}, expected at most 32`,
			{
				code: -32602,
				value: bytes,
				expected: "at most 32 bytes",
				context: { field, actualLength: bytes.length },
				docsPath: DOCS,
			},
		);
	}
	if (bytes.length === 32) return bytes;
	const padded = new Uint8Array(32);
	padded.set(bytes, 32 - bytes.length);
	return padded;
}

/**
 * Convert hex string to Uint8Array
 * @param {string} hex
 * @returns {Uint8Array}
 */
function fromHex(hex) {
	const h = hex.startsWith("0x") ? hex.slice(2) : hex;
	const padded = h.length % 2 === 0 ? h : `0${h}`;
	const bytes = new Uint8Array(padded.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseHexByte(padded, i * 2);
	}
	return bytes;
}

/**
 * Convert hex string to address bytes (20 bytes)
 * @param {string | null | undefined} hex
 * @returns {import('../Address/AddressType.js').AddressType | null}
 * @throws {InvalidLengthError} If address is not 20 bytes
 */
function hexToAddress(hex) {
	if (hex === null || hex === undefined) return null;
	const bytes = requireData("to", hex);
	if (bytes.length !== 20) {
		throw new InvalidLengthError(
			`Invalid address length: ${bytes.length}, expected 20`,
			{
				code: -32602,
				value: bytes,
				expected: "20 bytes",
				context: { actualLength: bytes.length },
				docsPath: "/primitives/transaction/from-rpc#error-handling",
			},
		);
	}
	return /** @type {import('../Address/AddressType.js').AddressType} */ (bytes);
}

/**
 * Convert hex string to address bytes (20 bytes), throws if null
 * @param {string} hex
 * @returns {import('../Address/AddressType.js').AddressType}
 * @throws {InvalidLengthError} If address is not 20 bytes
 */
function hexToAddressRequired(hex) {
	const bytes = requireData("address", hex);
	if (bytes.length !== 20) {
		throw new InvalidLengthError(
			`Invalid address length: ${bytes.length}, expected 20`,
			{
				code: -32602,
				value: bytes,
				expected: "20 bytes",
				context: { actualLength: bytes.length },
				docsPath: "/primitives/transaction/from-rpc#error-handling",
			},
		);
	}
	return /** @type {import('../Address/AddressType.js').AddressType} */ (bytes);
}

/**
 * Convert hex string to 32-byte hash
 * @param {string} hex
 * @returns {import('../Bytes32/Bytes32Type.js').Bytes32Type}
 * @throws {InvalidLengthError} If hash is not 32 bytes
 */
function hexToHash(hex) {
	const bytes = requireData("hash", hex);
	if (bytes.length !== 32) {
		throw new InvalidLengthError(
			`Invalid hash length: ${bytes.length}, expected 32`,
			{
				code: -32602,
				value: bytes,
				expected: "32 bytes",
				context: { actualLength: bytes.length },
				docsPath: "/primitives/transaction/from-rpc#error-handling",
			},
		);
	}
	return /** @type {import('../Bytes32/Bytes32Type.js').Bytes32Type} */ (bytes);
}

/**
 * @typedef {Object} RpcTransaction
 * @property {string} [type]
 * @property {string} [nonce]
 * @property {string} [gasLimit]
 * @property {string} [gas]
 * @property {string | null} [to]
 * @property {string} [value]
 * @property {string} [data]
 * @property {string} [input]
 * @property {string} [r]
 * @property {string} [s]
 * @property {string} [v]
 * @property {string} [yParity]
 * @property {string} [chainId]
 * @property {string} [gasPrice]
 * @property {string} [maxPriorityFeePerGas]
 * @property {string} [maxFeePerGas]
 * @property {string} [maxFeePerBlobGas]
 * @property {Array<{address: string, storageKeys?: string[]}>} [accessList]
 * @property {string[]} [blobVersionedHashes]
 * @property {Array<{chainId: string, address: string, nonce: string, yParity: string, r: string, s: string}>} [authorizationList]
 */

/**
 * Parse transaction from JSON-RPC format
 *
 * Required fields are never defaulted: `nonce`, `gas`/`gasLimit`, `value`,
 * `input`/`data`, `r`, `s`, and the fee, chain and parity fields of the
 * transaction type must all be present. A missing `type` means legacy. A
 * missing or null `to` is a contract creation. A missing `accessList` is
 * empty.
 *
 * @param {RpcTransaction} rpc - JSON-RPC formatted transaction
 * @returns {import('./types.js').Any} Parsed transaction
 * @throws {InvalidFormatError} If the input is not a transaction object (for
 * example a transaction hash from a hash-only block), or a required field is
 * missing or not hex
 * @throws {InvalidLengthError} If address or hash length is invalid
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 *
 * @example
 * ```javascript
 * import * as Transaction from './primitives/Transaction/index.js';
 * const tx = Transaction.fromRpc({
 *   type: '0x2',
 *   chainId: '0x1',
 *   nonce: '0x0',
 *   // ...
 * });
 * ```
 */
export function fromRpc(rpc) {
	if (rpc === null || typeof rpc !== "object" || Array.isArray(rpc)) {
		throw new InvalidFormatError(
			typeof rpc === "string"
				? "Expected a transaction object, got a string (transaction hash?)"
				: "Expected a transaction object",
			{
				code: -32602,
				value: rpc,
				expected: "JSON-RPC transaction object",
				docsPath: DOCS,
			},
		);
	}

	const type =
		rpc.type === undefined || rpc.type === null
			? Type.Legacy
			: Number(requireQuantity("type", rpc.type));

	const base = {
		nonce: requireQuantity("nonce", rpc.nonce),
		gasLimit: requireQuantity("gas", rpc.gasLimit ?? rpc.gas),
		to: hexToAddress(rpc.to),
		value: requireQuantity("value", rpc.value),
		data: requireData("input", rpc.data ?? rpc.input),
		r: requireScalar("r", rpc.r),
		s: requireScalar("s", rpc.s),
	};

	const accessList = () =>
		(rpc.accessList || []).map((item) => ({
			address: hexToAddressRequired(item.address),
			storageKeys: (item.storageKeys || []).map(
				(key) =>
					/** @type {import('../Hash/HashType.js').HashType} */ (
						/** @type {unknown} */ (hexToHash(key))
					),
			),
		}));
	const yParity = () =>
		Number(requireQuantity("yParity", rpc.yParity ?? rpc.v));

	switch (type) {
		case Type.Legacy:
			return {
				...base,
				type: Type.Legacy,
				gasPrice: requireQuantity("gasPrice", rpc.gasPrice),
				v: requireQuantity("v", rpc.v),
			};

		case Type.EIP2930:
			return {
				...base,
				type: Type.EIP2930,
				chainId: requireQuantity("chainId", rpc.chainId),
				gasPrice: requireQuantity("gasPrice", rpc.gasPrice),
				accessList: accessList(),
				yParity: yParity(),
			};

		case Type.EIP1559:
			return {
				...base,
				type: Type.EIP1559,
				chainId: requireQuantity("chainId", rpc.chainId),
				maxPriorityFeePerGas: requireQuantity(
					"maxPriorityFeePerGas",
					rpc.maxPriorityFeePerGas,
				),
				maxFeePerGas: requireQuantity("maxFeePerGas", rpc.maxFeePerGas),
				accessList: accessList(),
				yParity: yParity(),
			};

		case Type.EIP4844: {
			if (base.to === null) {
				throw invalidField("to", rpc.to, "20-byte address (EIP-4844)");
			}
			if (!Array.isArray(rpc.blobVersionedHashes)) {
				throw invalidField(
					"blobVersionedHashes",
					rpc.blobVersionedHashes,
					"array of 32-byte hashes",
				);
			}
			return {
				...base,
				to: base.to,
				type: Type.EIP4844,
				chainId: requireQuantity("chainId", rpc.chainId),
				maxPriorityFeePerGas: requireQuantity(
					"maxPriorityFeePerGas",
					rpc.maxPriorityFeePerGas,
				),
				maxFeePerGas: requireQuantity("maxFeePerGas", rpc.maxFeePerGas),
				accessList: accessList(),
				maxFeePerBlobGas: requireQuantity(
					"maxFeePerBlobGas",
					rpc.maxFeePerBlobGas,
				),
				blobVersionedHashes: rpc.blobVersionedHashes.map(
					(h) =>
						/** @type {import('../Hash/HashType.js').HashType} */ (
							/** @type {unknown} */ (hexToHash(h))
						),
				),
				yParity: yParity(),
			};
		}

		case Type.EIP7702: {
			if (!Array.isArray(rpc.authorizationList)) {
				throw invalidField(
					"authorizationList",
					rpc.authorizationList,
					"array of authorization tuples",
				);
			}
			return {
				...base,
				type: Type.EIP7702,
				chainId: requireQuantity("chainId", rpc.chainId),
				maxPriorityFeePerGas: requireQuantity(
					"maxPriorityFeePerGas",
					rpc.maxPriorityFeePerGas,
				),
				maxFeePerGas: requireQuantity("maxFeePerGas", rpc.maxFeePerGas),
				accessList: accessList(),
				authorizationList: rpc.authorizationList.map((auth) => ({
					chainId: requireQuantity("authorization chainId", auth.chainId),
					address: hexToAddressRequired(auth.address),
					nonce: requireQuantity("authorization nonce", auth.nonce),
					yParity: Number(
						requireQuantity("authorization yParity", auth.yParity),
					),
					r: requireScalar("authorization r", auth.r),
					s: requireScalar("authorization s", auth.s),
				})),
				yParity: yParity(),
			};
		}

		default:
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: ${type}`,
				{
					code: -32602,
					context: { type },
					docsPath: DOCS,
				},
			);
	}
}
