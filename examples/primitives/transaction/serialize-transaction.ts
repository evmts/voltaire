/**
 * Transaction Serialization Example
 *
 * Demonstrates RLP encoding/decoding for:
 * - Legacy transaction serialization
 * - EIP-1559 transaction serialization
 * - Type detection from bytes
 * - Round-trip serialization
 */

import * as Address from "../../../src/primitives/Address/index.js";
import * as Hash from "../../../src/primitives/Hash/index.js";
import * as Hex from "../../../src/primitives/Hex/index.js";
import * as Transaction from "../../../src/primitives/Transaction/index.js";

const legacyTx: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 9n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x3535353535353535353535353535353535353535"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 37n,
	r: Hex.toBytes(
		"0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276",
	),
	s: Hex.toBytes(
		"0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
	),
};

const legacySerialized = Transaction.serialize(legacyTx);

// Deserialize back
const legacyDeserialized = Transaction.deserialize(legacySerialized);

const eip1559Tx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 42n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 21000n,
	to: Address.from("0x3535353535353535353535353535353535353535"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: Hex.toBytes(
		"0x28ef61340bd939bc2195fe537567866003e1a15d3c71ff63e1590620aa636276",
	),
	s: Hex.toBytes(
		"0x67cbe9d8997f761aecb703304b3800ccf555c9f3dc64214b297fb1966a3b6d83",
	),
};

const eip1559Serialized = Transaction.serialize(eip1559Tx);

const eip1559Deserialized = Transaction.deserialize(eip1559Serialized);

const transactions = [
	{ name: "Legacy", data: legacySerialized },
	{ name: "EIP-1559", data: eip1559Serialized },
];

for (const tx of transactions) {
	const detectedType = Transaction.detectType(tx.data);
	const firstByte = tx.data[0];
}

const accessListTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 5n,
	maxPriorityFeePerGas: 2_000_000_000n,
	maxFeePerGas: 30_000_000_000n,
	gasLimit: 50_000n,
	to: Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
	value: 0n,
	data: Hex.toBytes("0xa9059cbb"),
	accessList: [
		{
			address: Address.from("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
			storageKeys: [
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000001",
				),
				Hash.from(
					"0x0000000000000000000000000000000000000000000000000000000000000002",
				),
			],
		},
	],
	yParity: 0,
	r: Hex.toBytes(`0x${"00".repeat(32)}`),
	s: Hex.toBytes(`0x${"00".repeat(32)}`),
};

const accessListSerialized = Transaction.serialize(accessListTx);

const accessListDeserialized = Transaction.deserialize(accessListSerialized);
if (Transaction.hasAccessList(accessListDeserialized)) {
	const deserializedAccessList = Transaction.getAccessList(
		accessListDeserialized,
	);
}

function verifyRoundTrip(tx: Transaction.Any, name: string): boolean {
	const serialized = Transaction.serialize(tx);
	const deserialized = Transaction.deserialize(serialized);
	const reserialized = Transaction.serialize(deserialized);

	// Compare bytes
	const match = Hex.fromBytes(serialized) === Hex.fromBytes(reserialized);

	return match;
}

verifyRoundTrip(legacyTx, "Legacy Transaction");
verifyRoundTrip(eip1559Tx, "EIP-1559 Transaction");
verifyRoundTrip(accessListTx, "Access List Transaction");

const txToSend = eip1559Tx;
const txHash = Transaction.hash(txToSend);
const serializedData = Transaction.serialize(txToSend);

const storedTx = legacyTx;
const storedBytes = Transaction.serialize(storedTx);
const storedHex = Hex.fromBytes(storedBytes);
const retrievedBytes = Hex.toBytes(storedHex);
const retrievedTx = Transaction.deserialize(retrievedBytes);
