import { Selector } from "@tevm/voltaire";
const safeTransferFrom = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256)",
);

const safeTransferFromData = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256,bytes)",
);

const transferFrom = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);

const approve = Selector.fromSignature("approve(address,uint256)");

const setApprovalForAll = Selector.fromSignature(
	"setApprovalForAll(address,bool)",
);

const getApproved = Selector.fromSignature("getApproved(uint256)");

const isApprovedForAll = Selector.fromSignature(
	"isApprovedForAll(address,address)",
);

const ownerOf = Selector.fromSignature("ownerOf(uint256)");

const balanceOf = Selector.fromSignature("balanceOf(address)");

const tokenURI = Selector.fromSignature("tokenURI(uint256)");

const name = Selector.fromSignature("name()");

const symbol = Selector.fromSignature("symbol()");

const totalSupply = Selector.fromSignature("totalSupply()");

const tokenByIndex = Selector.fromSignature("tokenByIndex(uint256)");

const tokenOfOwnerByIndex = Selector.fromSignature(
	"tokenOfOwnerByIndex(address,uint256)",
);

const erc20Transfer = Selector.fromSignature("transfer(address,uint256)");
const erc721Transfer = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);
