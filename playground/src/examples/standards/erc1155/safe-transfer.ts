/**
 * ERC-1155 safeTransferFrom - Transfer single token type
 *
 * Transfers a specified amount of a single token type.
 * Unlike ERC-721, you can transfer multiple units of the same token.
 */

import { Address, ERC1155, Uint256 } from "@tevm/voltaire";

// Setup transfer parameters
const from = Address("0xABc0000000000000000000000000000000000001");
const to = Address("0xDef0000000000000000000000000000000000002");
const tokenId = Uint256(42n);
const amount = Uint256(100n); // Transferring 100 units of token #42
const data = new Uint8Array(0); // Empty data

// Encode safeTransferFrom(address,address,uint256,uint256,bytes) calldata
const calldata = ERC1155.encodeSafeTransferFrom(
	from,
	to,
	tokenId,
	amount,
	data,
);
const mockTransferLog = {
	topics: [
		ERC1155.EVENTS.TransferSingle,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // operator
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // from
		"0x000000000000000000000000def0000000000000000000000000000000000002", // to
	],
	data: "0x000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000064", // id=42, value=100
};

const decoded = ERC1155.decodeTransferSingleEvent(mockTransferLog);
