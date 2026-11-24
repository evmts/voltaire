import { decodeParameters } from "../Abi/decodeParameters.js";
import { encodeParameters } from "../Abi/encodeParameters.js";
import { fromHex } from "../Address/fromHex.js";
import { verify } from "../Authorization/index.js";
import { fromBigInt } from "../Hex/fromBigInt.js";
import { fromBytes } from "../Hex/fromBytes.js";
import type { HexType } from "../Hex/HexType.js";
import { isHex } from "../Hex/isHex.js";
import { toBytes } from "../Hex/toBytes.js";

type Hex = `0x${string}`;

export type Unwrapped = {
	authorization: {
		address: Hex;
		chainId: number;
		nonce: bigint;
		yParity: number;
		r: bigint;
		s: bigint;
	};
	to?: Hex;
	data?: Hex;
	signature: Hex;
};

const magicBytes =
	"8010801080108010801080108010801080108010801080108010801080108010";
const wordSize = 32;
const addressSize = 20;
const trailerSize = 2 * wordSize;

// The static authorization tuple is encoded inline, and addresses occupy
// the same ABI word as uint160 values.
const suffixParameters = [
	{ type: "uint256" }, // chain ID
	{ type: "uint160" }, // delegation address
	{ type: "uint256" }, // nonce
	{ type: "uint8" }, // y parity
	{ type: "uint256" }, // r
	{ type: "uint256" }, // s
	{ type: "uint160" }, // initializer address
	{ type: "bytes" }, // initialization calldata
] as const;

/** Detects the ERC-8010 magic suffix. Use unwrap to parse the envelope. */
export function validate(signature: Hex): boolean {
	return (
		typeof signature === "string" &&
		signature.endsWith(magicBytes) &&
		signature.length % 2 === 0 &&
		isHex(signature)
	);
}

/** Parses the signature and the EIP-7702 authorization from an ERC-8010 envelope. */
export function unwrap(wrapped: Hex): Unwrapped {
	if (!validate(wrapped) || wrapped.length < 2 + 2 * trailerSize) {
		throw new Error("Invalid ERC-8010 signature trailer");
	}

	const suffixEnd = wrapped.length - 2 * trailerSize;
	const suffixLength = BigInt(`0x${wrapped.slice(suffixEnd, -2 * wordSize)}`);
	if (suffixLength > BigInt((suffixEnd - 2) / 2)) {
		throw new Error("ERC-8010 suffix length exceeds the envelope size");
	}

	const suffixStart = suffixEnd - Number(suffixLength) * 2;
	const [chainId, delegation, nonce, yParity, r, s, to, data] =
		decodeParameters(
			suffixParameters,
			toBytes(`0x${wrapped.slice(suffixStart, suffixEnd)}`),
		);
	if (chainId > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new RangeError("ERC-8010 chain ID exceeds the safe integer range");
	}

	return {
		authorization: {
			address: fromBigInt(delegation, addressSize),
			chainId: Number(chainId),
			nonce,
			yParity: Number(yParity),
			r,
			s,
		},
		signature: `0x${wrapped.slice(2, suffixStart)}`,
		...(data.length > 0
			? { data: fromBytes(data), to: fromBigInt(to, addressSize) }
			: {}),
	};
}

/** Wraps a signature with its EIP-7702 authorization and optional initializer. */
export function wrap({
	authorization,
	data,
	signature,
	to,
}: Unwrapped): HexType {
	const { address, chainId, nonce, yParity, r, s } = authorization;
	if (!Number.isSafeInteger(chainId) || chainId < 0) {
		throw new RangeError(
			"ERC-8010 chain ID must be a nonnegative safe integer",
		);
	}
	const delegation = fromHex(address);
	const initializer =
		to === undefined
			? verify({
					address: delegation,
					chainId: BigInt(chainId),
					nonce,
					yParity,
					r: toBytes(fromBigInt(r, wordSize)),
					s: toBytes(fromBigInt(s, wordSize)),
				})
			: fromHex(to);

	const suffix = encodeParameters(suffixParameters, [
		BigInt(chainId),
		BigInt(address),
		nonce,
		BigInt(yParity),
		r,
		s,
		BigInt(fromBytes(initializer)),
		toBytes(data ?? "0x"),
	]);

	if (signature !== "0x" && (signature.length % 2 !== 0 || !isHex(signature))) {
		throw new Error("Invalid ERC-8010 inner signature hex");
	}
	const suffixHex = fromBytes(suffix).slice(2);
	const lengthHex = fromBigInt(BigInt(suffix.length), wordSize).slice(2);
	return `${signature}${suffixHex}${lengthHex}${magicBytes}` as HexType;
}
