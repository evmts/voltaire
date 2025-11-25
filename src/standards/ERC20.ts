import type { AddressType } from "../primitives/Address/AddressType.js";
import type { Uint256Type } from "../primitives/Uint/Uint256Type.js";

/**
 * ERC-20 Token Standard
 * Ethereum Improvement Proposal 20 (EIP-20)
 *
 * Standard interface for fungible tokens on Ethereum.
 */

/**
 * ERC-20 function selectors
 * First 4 bytes of keccak256 hash of function signature
 */
export const SELECTORS = {
	/** totalSupply() */
	totalSupply: "0x18160ddd",
	/** balanceOf(address) */
	balanceOf: "0x70a08231",
	/** transfer(address,uint256) */
	transfer: "0xa9059cbb",
	/** transferFrom(address,address,uint256) */
	transferFrom: "0x23b872dd",
	/** approve(address,uint256) */
	approve: "0x095ea7b3",
	/** allowance(address,address) */
	allowance: "0xdd62ed3e",
	/** name() */
	name: "0x06fdde03",
	/** symbol() */
	symbol: "0x95d89b41",
	/** decimals() */
	decimals: "0x313ce567",
	// EIP-2612 Permit extension
	/** permit(address,address,uint256,uint256,uint8,bytes32,bytes32) */
	permit: "0xd505accf",
	/** nonces(address) */
	nonces: "0x7ecebe00",
	/** DOMAIN_SEPARATOR() */
	DOMAIN_SEPARATOR: "0x3644e515",
} as const;

/**
 * ERC-20 event signatures
 * keccak256 hash of event signature
 */
export const EVENTS = {
	/** Transfer(address indexed from, address indexed to, uint256 value) */
	Transfer:
		"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
	/** Approval(address indexed owner, address indexed spender, uint256 value) */
	Approval:
		"0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
} as const;

/**
 * Encode transfer(address,uint256) calldata
 */
export function encodeTransfer(to: AddressType, amount: Uint256Type): string {
	// Convert address (20 bytes) to hex and pad to 32 bytes
	const toHex = Array.from(to, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const amountHex = amount.toString(16).padStart(64, "0");
	return `${SELECTORS.transfer}${toHex}${amountHex}`;
}

/**
 * Encode approve(address,uint256) calldata
 */
export function encodeApprove(
	spender: AddressType,
	amount: Uint256Type,
): string {
	// Convert address (20 bytes) to hex and pad to 32 bytes
	const spenderHex = Array.from(spender, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const amountHex = amount.toString(16).padStart(64, "0");
	return `${SELECTORS.approve}${spenderHex}${amountHex}`;
}

/**
 * Encode transferFrom(address,address,uint256) calldata
 */
export function encodeTransferFrom(
	from: AddressType,
	to: AddressType,
	amount: Uint256Type,
): string {
	// Convert addresses (20 bytes each) to hex and pad to 32 bytes
	const fromHex = Array.from(from, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const toHex = Array.from(to, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const amountHex = amount.toString(16).padStart(64, "0");
	return `${SELECTORS.transferFrom}${fromHex}${toHex}${amountHex}`;
}

/**
 * Encode balanceOf(address) calldata
 */
export function encodeBalanceOf(account: AddressType): string {
	// Convert address (20 bytes) to hex and pad to 32 bytes
	const accountHex = Array.from(account, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	return `${SELECTORS.balanceOf}${accountHex}`;
}

/**
 * Encode allowance(address,address) calldata
 */
export function encodeAllowance(
	owner: AddressType,
	spender: AddressType,
): string {
	// Convert addresses (20 bytes each) to hex and pad to 32 bytes
	const ownerHex = Array.from(owner, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const spenderHex = Array.from(spender, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	return `${SELECTORS.allowance}${ownerHex}${spenderHex}`;
}

/**
 * Decode Transfer event log
 */
export function decodeTransferEvent(log: {
	topics: string[];
	data: string;
}): {
	from: string;
	to: string;
	value: Uint256Type;
} {
	if (log.topics[0] !== EVENTS.Transfer) {
		throw new Error("Not a Transfer event");
	}

	// Topics: [event_sig, from, to]
	const fromTopic = log.topics[1];
	const toTopic = log.topics[2];
	if (!fromTopic || !toTopic) {
		throw new Error("Missing Transfer event topics");
	}
	const from = `0x${fromTopic.slice(26)}`; // Remove padding
	const to = `0x${toTopic.slice(26)}`; // Remove padding
	const value = BigInt(log.data) as Uint256Type;

	return { from, to, value };
}

/**
 * Decode Approval event log
 */
export function decodeApprovalEvent(log: {
	topics: string[];
	data: string;
}): {
	owner: string;
	spender: string;
	value: Uint256Type;
} {
	if (log.topics[0] !== EVENTS.Approval) {
		throw new Error("Not an Approval event");
	}

	// Topics: [event_sig, owner, spender]
	const ownerTopic = log.topics[1];
	const spenderTopic = log.topics[2];
	if (!ownerTopic || !spenderTopic) {
		throw new Error("Missing Approval event topics");
	}
	const owner = `0x${ownerTopic.slice(26)}`; // Remove padding
	const spender = `0x${spenderTopic.slice(26)}`; // Remove padding
	const value = BigInt(log.data) as Uint256Type;

	return { owner, spender, value };
}

/**
 * Decode uint256 return value
 */
export function decodeUint256(data: string): Uint256Type {
	return BigInt(data) as Uint256Type;
}

/**
 * Decode address return value
 */
export function decodeAddress(data: string): string {
	// Remove 0x prefix and padding, keep last 40 chars (20 bytes)
	return `0x${data.slice(-40)}`;
}

/**
 * Decode bool return value
 */
export function decodeBool(data: string): boolean {
	return BigInt(data) !== 0n;
}

/**
 * Decode string return value
 */
export function decodeString(data: string): string {
	// ABI encoded string: offset (32 bytes) + length (32 bytes) + data
	const hex = data.startsWith("0x") ? data.slice(2) : data;
	const offset = Number.parseInt(hex.slice(0, 64), 16);
	const length = Number.parseInt(hex.slice(64, 128), 16);
	const stringData = hex.slice(128, 128 + length * 2);

	// Convert hex to UTF-8 string manually
	const bytes = new Uint8Array(stringData.length / 2);
	for (let i = 0; i < stringData.length; i += 2) {
		bytes[i / 2] = Number.parseInt(stringData.slice(i, i + 2), 16);
	}
	return new TextDecoder().decode(bytes);
}
