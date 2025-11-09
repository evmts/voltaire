/**
 * Transaction Type Detection Example
 *
 * Demonstrates:
 * - Detecting transaction type from serialized bytes
 * - Using type guards to narrow transaction types
 * - Type-specific operations for each transaction type
 * - Handling all transaction types in a type-safe way
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

const legacyTx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 37n,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

const eip1559Tx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

function describeTransaction(tx: Transaction.Any): string {
	if (Transaction.isLegacy(tx)) {
		return `Legacy tx: gasPrice=${tx.gasPrice / 1_000_000_000n} gwei, v=${tx.v}`;
	}
	if (Transaction.isEIP2930(tx)) {
		return `EIP-2930 tx: gasPrice=${tx.gasPrice / 1_000_000_000n} gwei, accessList=${tx.accessList.length} items`;
	}
	if (Transaction.isEIP1559(tx)) {
		return `EIP-1559 tx: maxFee=${tx.maxFeePerGas / 1_000_000_000n} gwei, priority=${tx.maxPriorityFeePerGas / 1_000_000_000n} gwei`;
	}
	if (Transaction.isEIP4844(tx)) {
		return `EIP-4844 tx: blobs=${tx.blobVersionedHashes.length}, maxBlobFee=${tx.maxFeePerBlobGas / 1_000_000_000n} gwei`;
	}
	if (Transaction.isEIP7702(tx)) {
		return `EIP-7702 tx: authorizations=${tx.authorizationList.length}`;
	}
	return "Unknown transaction type";
}

function getTransactionTypeName(tx: Transaction.Any): string {
	switch (tx.type) {
		case Transaction.Type.Legacy:
			return "Legacy (Type 0)";
		case Transaction.Type.EIP2930:
			return "EIP-2930 (Type 1)";
		case Transaction.Type.EIP1559:
			return "EIP-1559 (Type 2)";
		case Transaction.Type.EIP4844:
			return "EIP-4844 (Type 3)";
		case Transaction.Type.EIP7702:
			return "EIP-7702 (Type 4)";
		default:
			return "Unknown";
	}
}

const transactions: Transaction.Any[] = [legacyTx, eip1559Tx];

for (const tx of transactions) {
}

function getChainId(tx: Transaction.Any): bigint | null {
	if (Transaction.isLegacy(tx)) {
		// Legacy uses v value to encode chain ID
		return Transaction.Legacy.getChainId.call(tx);
	}
	// All typed transactions have explicit chainId
	return tx.chainId;
}

function hasAccessList(tx: Transaction.Any): boolean {
	return Transaction.hasAccessList(tx);
}

function isContractCreation(tx: Transaction.Any): boolean {
	if (Transaction.isEIP4844(tx)) {
		// Blob transactions cannot create contracts
		return false;
	}
	return tx.to === null;
}

// Type byte detection rules:
// - If first byte < 0x7f: typed transaction (byte = type)
// - If first byte >= 0xc0: Legacy transaction (RLP list)

const typeBytes = [
	{ byte: 0xf8, name: "Legacy (RLP list)", type: "Legacy" },
	{ byte: 0x01, name: "EIP-2930", type: "Type 1" },
	{ byte: 0x02, name: "EIP-1559", type: "Type 2" },
	{ byte: 0x03, name: "EIP-4844", type: "Type 3" },
	{ byte: 0x04, name: "EIP-7702", type: "Type 4" },
];
for (const { byte, name, type } of typeBytes) {
	const hexByte = `0x${byte.toString(16).padStart(2, "0")}`;
}

const typeMapping = [
	{
		enum: Transaction.Type.Legacy,
		hex: "0x00",
		name: "Legacy",
		introduced: "Genesis (2015)",
	},
	{
		enum: Transaction.Type.EIP2930,
		hex: "0x01",
		name: "EIP-2930",
		introduced: "Berlin (2021)",
	},
	{
		enum: Transaction.Type.EIP1559,
		hex: "0x02",
		name: "EIP-1559",
		introduced: "London (2021)",
	},
	{
		enum: Transaction.Type.EIP4844,
		hex: "0x03",
		name: "EIP-4844",
		introduced: "Dencun (2024)",
	},
	{
		enum: Transaction.Type.EIP7702,
		hex: "0x04",
		name: "EIP-7702",
		introduced: "Pectra (TBD)",
	},
];
for (const { enum: typeEnum, hex, name, introduced } of typeMapping) {
}

interface TransactionFeatures {
	accessList: boolean;
	dynamicFees: boolean;
	blobs: boolean;
	authorization: boolean;
	contractCreation: boolean;
}

function getFeatures(tx: Transaction.Any): TransactionFeatures {
	return {
		accessList: Transaction.hasAccessList(tx),
		dynamicFees:
			Transaction.isEIP1559(tx) ||
			Transaction.isEIP4844(tx) ||
			Transaction.isEIP7702(tx),
		blobs: Transaction.isEIP4844(tx),
		authorization: Transaction.isEIP7702(tx),
		contractCreation: !Transaction.isEIP4844(tx), // Only EIP-4844 cannot create contracts
	};
}

const allTypes: Transaction.Any[] = [
	legacyTx,
	{
		type: Transaction.Type.EIP2930,
		chainId: 1n,
		nonce: 0n,
		gasPrice: 20_000_000_000n,
		gasLimit: 21000n,
		to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
		value: 0n,
		data: new Uint8Array(),
		accessList: [],
		yParity: 0,
		r: Hex.toBytes(`0x${"00".repeat(32)}`),
		s: Hex.toBytes(`0x${"00".repeat(32)}`),
	} as Transaction.EIP2930,
	eip1559Tx,
];

const featureNames: (keyof TransactionFeatures)[] = [
	"accessList",
	"dynamicFees",
	"blobs",
	"authorization",
	"contractCreation",
];

for (const featureName of featureNames) {
	const values = allTypes.map((tx) =>
		getFeatures(tx)[featureName] ? "✓" : "✗",
	);
	const line = `${featureName.padEnd(15)} ${values.join("       ")}`;
}

function formatTransaction(tx: Transaction.Any): string {
	const typeName = getTransactionTypeName(tx);
	const chainId = getChainId(tx);
	const hasAccess = hasAccessList(tx);

	let details = `${typeName}\n`;
	details += `  Chain ID: ${chainId}\n`;
	details += `  Nonce: ${tx.nonce}\n`;
	details += `  Gas Limit: ${tx.gasLimit}\n`;

	if (Transaction.isLegacy(tx)) {
		details += `  Gas Price: ${tx.gasPrice / 1_000_000_000n} gwei\n`;
		details += `  v: ${tx.v}\n`;
	} else if (
		Transaction.isEIP1559(tx) ||
		Transaction.isEIP4844(tx) ||
		Transaction.isEIP7702(tx)
	) {
		details += `  Max Fee: ${tx.maxFeePerGas / 1_000_000_000n} gwei\n`;
		details += `  Priority Fee: ${tx.maxPriorityFeePerGas / 1_000_000_000n} gwei\n`;
		details += `  yParity: ${tx.yParity}\n`;
	} else if (Transaction.isEIP2930(tx)) {
		details += `  Gas Price: ${tx.gasPrice / 1_000_000_000n} gwei\n`;
		details += `  yParity: ${tx.yParity}\n`;
	}

	if (hasAccess) {
		details += `  Access List: ${Transaction.getAccessList(tx).length} items\n`;
	}

	if (Transaction.isEIP4844(tx)) {
		details += `  Blobs: ${tx.blobVersionedHashes.length}\n`;
		details += `  Max Blob Fee: ${tx.maxFeePerBlobGas / 1_000_000_000n} gwei\n`;
	}

	if (Transaction.isEIP7702(tx)) {
		details += `  Authorizations: ${tx.authorizationList.length}\n`;
	}

	return details;
}
