/**
 * ERC-721 transferFrom - NFT transfer encoding
 *
 * The transferFrom function transfers ownership of an NFT.
 * Unlike safeTransferFrom, it does not check if recipient can handle NFTs.
 */

import { Address, ERC721, Uint256 } from "@tevm/voltaire";

// Setup transfer parameters
const from = Address("0xABc0000000000000000000000000000000000001"); // Current owner
const to = Address("0xDef0000000000000000000000000000000000002"); // New owner
const tokenId = Uint256(42n);

// Encode transferFrom(address,address,uint256) calldata
const calldata = ERC721.encodeTransferFrom(from, to, tokenId);
const mockTransferLog = {
	topics: [
		ERC721.EVENTS.Transfer,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // from
		"0x000000000000000000000000def0000000000000000000000000000000000002", // to
		"0x000000000000000000000000000000000000000000000000000000000000002a", // tokenId (42)
	],
	data: "0x",
};

const decoded = ERC721.decodeTransferEvent(mockTransferLog);
