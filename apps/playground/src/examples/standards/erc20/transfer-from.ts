/**
 * ERC-20 transferFrom - TransferFrom encoding
 *
 * The transferFrom function allows transferring tokens on behalf of another account,
 * provided the caller has been approved to spend the tokens.
 */

import { Address, ERC20, Uint256 } from "@tevm/voltaire";

// Setup transferFrom parameters
const from = Address("0xABc0000000000000000000000000000000000001"); // Token owner
const to = Address("0xDef0000000000000000000000000000000000002"); // Recipient
const amount = Uint256(500000000000000000000n); // 500 tokens with 18 decimals

// Encode transferFrom(address,address,uint256) calldata
const calldata = ERC20.encodeTransferFrom(from, to, amount);
const mockTransferLog = {
	topics: [
		ERC20.EVENTS.Transfer,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // from
		"0x000000000000000000000000def0000000000000000000000000000000000002", // to
	],
	data: "0x00000000000000000000000000000000000000000000001b1ae4d6e2ef500000", // 500 tokens
};

const decoded = ERC20.decodeTransferEvent(mockTransferLog);
