/**
 * ERC-20 transfer - Token transfer encoding
 *
 * The transfer function moves tokens from the caller to a recipient.
 */

import { Address, ERC20, Uint256 } from "@tevm/voltaire";

// Setup transfer parameters
const recipient = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f5bEb2");
const amount = Uint256(1000000000000000000n); // 1 token with 18 decimals

// Encode transfer(address,uint256) calldata
const calldata = ERC20.encodeTransfer(recipient, amount);
const amounts = [
	{ desc: "0.001 tokens", value: 1000000000000000n },
	{ desc: "1 token", value: 1000000000000000000n },
	{ desc: "100 tokens", value: 100000000000000000000n },
	{ desc: "1,000,000 tokens", value: 1000000000000000000000000n },
];

for (const { desc, value } of amounts) {
	const amt = Uint256(value);
	const data = ERC20.encodeTransfer(recipient, amt);
}
const successReturn =
	"0x0000000000000000000000000000000000000000000000000000000000000001";
const failReturn =
	"0x0000000000000000000000000000000000000000000000000000000000000000";
