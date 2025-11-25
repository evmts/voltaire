import type { AddressType } from "../primitives/Address/AddressType.js";
import type { Uint256Type } from "../primitives/Uint/Uint256Type.js";

/**
 * ERC-1155 Multi Token Standard
 * Ethereum Improvement Proposal 1155 (EIP-1155)
 *
 * Standard interface for multi-token contracts supporting both fungible and non-fungible tokens.
 */

/**
 * ERC-1155 function selectors
 * First 4 bytes of keccak256 hash of function signature
 */
export const SELECTORS = {
	/** balanceOf(address,uint256) */
	balanceOf: "0x00fdd58e",
	/** balanceOfBatch(address[],uint256[]) */
	balanceOfBatch: "0x4e1273f4",
	/** setApprovalForAll(address,bool) */
	setApprovalForAll: "0xa22cb465",
	/** isApprovedForAll(address,address) */
	isApprovedForAll: "0xe985e9c5",
	/** safeTransferFrom(address,address,uint256,uint256,bytes) */
	safeTransferFrom: "0xf242432a",
	/** safeBatchTransferFrom(address,address,uint256[],uint256[],bytes) */
	safeBatchTransferFrom: "0x2eb2c2d6",
	// ERC-1155 Metadata extension
	/** uri(uint256) */
	uri: "0x0e89341c",
} as const;

/**
 * ERC-1155 event signatures
 * keccak256 hash of event signature
 */
export const EVENTS = {
	/** TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value) */
	TransferSingle:
		"0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
	/** TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values) */
	TransferBatch:
		"0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb",
	/** ApprovalForAll(address indexed account, address indexed operator, bool approved) */
	ApprovalForAll:
		"0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31",
	/** URI(string value, uint256 indexed id) */
	URI: "0x6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b",
} as const;

/**
 * Encode balanceOf(address,uint256) calldata
 */
export function encodeBalanceOf(account: AddressType, id: Uint256Type): string {
	// Convert address (20 bytes) to hex and pad to 32 bytes
	const accountHex = Array.from(account, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const idHex = id.toString(16).padStart(64, "0");
	return `${SELECTORS.balanceOf}${accountHex}${idHex}`;
}

/**
 * Encode setApprovalForAll(address,bool) calldata
 */
export function encodeSetApprovalForAll(
	operator: AddressType,
	approved: boolean,
): string {
	// Convert address (20 bytes) to hex and pad to 32 bytes
	const operatorHex = Array.from(operator, (b) =>
		b.toString(16).padStart(2, "0"),
	)
		.join("")
		.padStart(64, "0");
	const approvedHex = approved ? "1".padStart(64, "0") : "0".padStart(64, "0");
	return `${SELECTORS.setApprovalForAll}${operatorHex}${approvedHex}`;
}

/**
 * Encode safeTransferFrom(address,address,uint256,uint256,bytes) calldata
 */
export function encodeSafeTransferFrom(
	from: AddressType,
	to: AddressType,
	id: Uint256Type,
	amount: Uint256Type,
	data: Uint8Array = new Uint8Array(0),
): string {
	// Convert addresses (20 bytes each) to hex and pad to 32 bytes
	const fromHex = Array.from(from, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const toHex = Array.from(to, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const idHex = id.toString(16).padStart(64, "0");
	const amountHex = amount.toString(16).padStart(64, "0");

	// Encode data as dynamic bytes
	const dataOffset = "a0"; // 160 bytes offset (5 * 32)
	const dataLength = data.length.toString(16).padStart(64, "0");
	const dataHex = Array.from(data, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padEnd(Math.ceil(data.length / 32) * 64, "0");

	return `${SELECTORS.safeTransferFrom}${fromHex}${toHex}${idHex}${amountHex}${dataOffset}${dataLength}${dataHex}`;
}

/**
 * Encode isApprovedForAll(address,address) calldata
 */
export function encodeIsApprovedForAll(
	account: AddressType,
	operator: AddressType,
): string {
	// Convert addresses (20 bytes each) to hex and pad to 32 bytes
	const accountHex = Array.from(account, (b) => b.toString(16).padStart(2, "0"))
		.join("")
		.padStart(64, "0");
	const operatorHex = Array.from(operator, (b) =>
		b.toString(16).padStart(2, "0"),
	)
		.join("")
		.padStart(64, "0");
	return `${SELECTORS.isApprovedForAll}${accountHex}${operatorHex}`;
}

/**
 * Encode uri(uint256) calldata
 */
export function encodeURI(id: Uint256Type): string {
	const idHex = id.toString(16).padStart(64, "0");
	return `${SELECTORS.uri}${idHex}`;
}

/**
 * Decode TransferSingle event log
 */
export function decodeTransferSingleEvent(log: {
	topics: string[];
	data: string;
}): {
	operator: string;
	from: string;
	to: string;
	id: Uint256Type;
	value: Uint256Type;
} {
	if (log.topics[0] !== EVENTS.TransferSingle) {
		throw new Error("Not a TransferSingle event");
	}

	// Topics: [event_sig, operator, from, to]
	const operatorTopic = log.topics[1];
	const fromTopic = log.topics[2];
	const toTopic = log.topics[3];
	if (!operatorTopic || !fromTopic || !toTopic) {
		throw new Error("Missing TransferSingle event topics");
	}
	const operator = `0x${operatorTopic.slice(26)}`; // Remove padding
	const from = `0x${fromTopic.slice(26)}`; // Remove padding
	const to = `0x${toTopic.slice(26)}`; // Remove padding

	// Data: [id, value]
	const dataHex = log.data.startsWith("0x") ? log.data.slice(2) : log.data;
	const id = BigInt(`0x${dataHex.slice(0, 64)}`) as Uint256Type;
	const value = BigInt(`0x${dataHex.slice(64, 128)}`) as Uint256Type;

	return { operator, from, to, id, value };
}

/**
 * Decode ApprovalForAll event log
 */
export function decodeApprovalForAllEvent(log: {
	topics: string[];
	data: string;
}): {
	account: string;
	operator: string;
	approved: boolean;
} {
	if (log.topics[0] !== EVENTS.ApprovalForAll) {
		throw new Error("Not an ApprovalForAll event");
	}

	// Topics: [event_sig, account, operator]
	const accountTopic = log.topics[1];
	const operatorTopic = log.topics[2];
	if (!accountTopic || !operatorTopic) {
		throw new Error("Missing ApprovalForAll event topics");
	}
	const account = `0x${accountTopic.slice(26)}`; // Remove padding
	const operator = `0x${operatorTopic.slice(26)}`; // Remove padding
	const approved = BigInt(log.data) !== 0n;

	return { account, operator, approved };
}
