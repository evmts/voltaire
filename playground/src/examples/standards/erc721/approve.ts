/**
 * ERC-721 approve - NFT approval encoding
 *
 * ERC-721 has two approval mechanisms:
 * 1. approve(address, tokenId) - Approve one address for one specific token
 * 2. setApprovalForAll(address, bool) - Approve an operator for all your tokens
 */

import { Address, ERC721, Uint256 } from "@tevm/voltaire";

const approved = Address("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"); // Approved address
const tokenId = Uint256(42n);

// Encode approve(address,uint256) calldata
const approveCalldata = ERC721.encodeApprove(approved, tokenId);

const operator = Address("0x1E0049783F008A0085193E00003D00cd54003c71"); // OpenSea
const isApproved = true;

// Encode setApprovalForAll(address,bool) calldata
const setApprovalCalldata = ERC721.encodeSetApprovalForAll(
	operator,
	isApproved,
);
const revokeCalldata = ERC721.encodeSetApprovalForAll(operator, false);
const mockApprovalLog = {
	topics: [
		ERC721.EVENTS.Approval,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // owner
		"0x0000000000000000000000007a250d5630b4cf539739df2c5dacb4c659f2488d", // approved
		"0x000000000000000000000000000000000000000000000000000000000000002a", // tokenId
	],
	data: "0x",
};

const decodedApproval = ERC721.decodeApprovalEvent(mockApprovalLog);
const mockApprovalForAllLog = {
	topics: [
		ERC721.EVENTS.ApprovalForAll,
		"0x000000000000000000000000abc0000000000000000000000000000000000001", // owner
		"0x0000000000000000000000001e0049783f008a0085193e00003d00cd54003c71", // operator
	],
	data: "0x0000000000000000000000000000000000000000000000000000000000000001", // approved = true
};

const decodedApprovalForAll = ERC721.decodeApprovalForAllEvent(
	mockApprovalForAllLog,
);
