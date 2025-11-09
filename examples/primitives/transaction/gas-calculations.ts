/**
 * Gas Calculations Example
 *
 * Demonstrates gas calculations for all transaction types:
 * - Legacy fixed gas price
 * - EIP-1559 effective gas price
 * - EIP-4844 blob gas costs
 * - Total cost estimation
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hash from "../../../src/primitives/Hash/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

const legacyTx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 0n,
	gasPrice: 20_000_000_000n, // 20 gwei
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 37n,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

const legacyGasUsed = 21000n;
const legacyGasCost = legacyTx.gasPrice * legacyGasUsed;
const legacyTotalCost = legacyGasCost + legacyTx.value;

const eip1559Tx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei tip
	maxFeePerGas: 30_000_000_000n, // 30 gwei max
	gasLimit: 21000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

const baseFee = 15_000_000_000n; // 15 gwei
const eip1559EffectivePrice = Transaction.EIP1559.getEffectiveGasPrice(
	eip1559Tx,
	baseFee,
);
const eip1559GasUsed = 21000n;

const eip1559MaxCost =
	eip1559Tx.maxFeePerGas * eip1559Tx.gasLimit + eip1559Tx.value;
const eip1559ActualCost =
	eip1559EffectivePrice * eip1559GasUsed + eip1559Tx.value;
const refund =
	(eip1559Tx.maxFeePerGas - eip1559EffectivePrice) * eip1559GasUsed;

const blobTx: Transaction.EIP4844 = {
	type: Transaction.Type.EIP4844,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 1_000_000_000n,
	maxFeePerGas: 20_000_000_000n,
	gasLimit: 100_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
	value: 0n,
	data: new Uint8Array(),
	accessList: [],
	maxFeePerBlobGas: 2_000_000_000n,
	blobVersionedHashes: [
		Hash.from(
			"0x0100000000000000000000000000000000000000000000000000000000000001",
		),
		Hash.from(
			"0x0100000000000000000000000000000000000000000000000000000000000002",
		),
		Hash.from(
			"0x0100000000000000000000000000000000000000000000000000000000000003",
		),
	],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

const blobBaseFee = 1n; // 1 wei per blob gas
const blobGasUsed = 50_000n;

const execEffectivePrice = Transaction.EIP4844.getEffectiveGasPrice(
	blobTx,
	baseFee,
);
const execCost = execEffectivePrice * blobGasUsed;
const blobCost = Transaction.EIP4844.getBlobGasCost(blobTx, blobBaseFee);
const totalBlobTxCost = execCost + blobCost + blobTx.value;

const transactions: Transaction.Any[] = [legacyTx, eip1559Tx, blobTx];

for (const tx of transactions) {
	const gasPrice = Transaction.getGasPrice(tx, baseFee);
}

const currentBaseFee = 15_000_000_000n;

function formatCost(wei: bigint): string {
	const eth = wei / 1_000_000_000_000_000_000n;
	const gwei = wei / 1_000_000_000n;
	return `${wei} wei (${gwei} gwei, ${eth} ETH)`;
}
