/**
 * ERC-721 transferFrom - NFT transfer encoding
 *
 * The transferFrom function transfers ownership of an NFT.
 * Unlike safeTransferFrom, it does not check if recipient can handle NFTs.
 */

import { Address, Uint256, ERC721 } from "@tevm/voltaire";

// Setup transfer parameters
const from = Address("0xABc0000000000000000000000000000000000001"); // Current owner
const to = Address("0xDef0000000000000000000000000000000000002"); // New owner
const tokenId = Uint256(42n);

// Encode transferFrom(address,address,uint256) calldata
const calldata = ERC721.encodeTransferFrom(from, to, tokenId);

console.log("=== ERC-721 transferFrom Encoding ===");
console.log("From:", "0xABc0000000000000000000000000000000000001");
console.log("To:", "0xDef0000000000000000000000000000000000002");
console.log("Token ID:", tokenId.toString());
console.log("Selector:", ERC721.SELECTORS.transferFrom);
console.log("\nEncoded calldata:", calldata);

// Breakdown of the calldata
console.log("\n=== Calldata Breakdown ===");
console.log("Selector (4 bytes):", calldata.slice(0, 10));
console.log("From (32 bytes):", "0x" + calldata.slice(10, 74));
console.log("To (32 bytes):", "0x" + calldata.slice(74, 138));
console.log("Token ID (32 bytes):", "0x" + calldata.slice(138));

// Decoding Transfer event
console.log("\n=== Decoding Transfer Event ===");
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
console.log("From:", decoded.from);
console.log("To:", decoded.to);
console.log("Token ID:", decoded.tokenId.toString());

// transferFrom vs safeTransferFrom
console.log("\n=== transferFrom vs safeTransferFrom ===");
console.log("transferFrom:");
console.log("  - Does NOT check if recipient can receive NFTs");
console.log("  - Cheaper gas cost");
console.log("  - Risk: NFT can be lost if sent to contract without receiver");
console.log("\nsafeTransferFrom:");
console.log("  - Checks if recipient implements ERC721Receiver");
console.log("  - Higher gas cost");
console.log("  - Safer for sending to unknown addresses");
