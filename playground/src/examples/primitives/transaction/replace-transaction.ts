import * as Address from "../../../primitives/Address/index.js";
// Transaction Replacement: Bump fees to replace pending transaction
import * as Transaction from "../../../primitives/Transaction/index.js";

// Original pending transaction
const pendingTx: Transaction.EIP1559 = {
	type: Transaction.Type.EIP1559,
	chainId: 1n,
	nonce: 5n, // Same nonce to replace
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
	maxFeePerGas: 30_000_000_000n, // 30 gwei
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	accessList: [],
	yParity: 0,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

// Replace with default 10% fee bump
const replaced = Transaction.replaceWith(pendingTx);
if ("maxPriorityFeePerGas" in replaced) {
}
if ("maxFeePerGas" in replaced) {
}

// Replace with custom fee bump
const customReplaced = Transaction.replaceWith(pendingTx, {
	feeBumpPercent: 20, // 20% increase
});
if ("maxPriorityFeePerGas" in customReplaced) {
}
if ("maxFeePerGas" in customReplaced) {
}

// For legacy transactions
const pendingLegacy: Transaction.Legacy = {
	type: Transaction.Type.Legacy,
	nonce: 5n,
	gasPrice: 20_000_000_000n,
	gasLimit: 21_000n,
	to: Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e"),
	value: 1_000_000_000_000_000_000n,
	data: new Uint8Array(),
	v: 27n,
	r: new Uint8Array(32),
	s: new Uint8Array(32),
};

const replacedLegacy = Transaction.replaceWith(pendingLegacy);
