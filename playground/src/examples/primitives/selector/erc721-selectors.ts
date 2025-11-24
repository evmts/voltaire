import * as Selector from "../../../primitives/Selector/index.js";

// Example: ERC721 NFT function selectors

console.log("=== ERC721 NFT Standard Selectors ===\n");

console.log("--- Transfer Functions ---\n");

const safeTransferFrom = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256)",
);
console.log(`safeTransferFrom(address,address,uint256)`);
console.log(`  Selector: ${Selector.toHex(safeTransferFrom)}`);
console.log(`  Usage: Safe NFT transfer with receiver check\n`);

const safeTransferFromData = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256,bytes)",
);
console.log(`safeTransferFrom(address,address,uint256,bytes)`);
console.log(`  Selector: ${Selector.toHex(safeTransferFromData)}`);
console.log(`  Usage: Safe NFT transfer with data\n`);

const transferFrom = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);
console.log(`transferFrom(address,address,uint256)`);
console.log(`  Selector: ${Selector.toHex(transferFrom)}`);
console.log(`  Usage: Basic NFT transfer\n`);

console.log("--- Approval Functions ---\n");

const approve = Selector.fromSignature("approve(address,uint256)");
console.log(`approve(address,uint256)`);
console.log(`  Selector: ${Selector.toHex(approve)}`);
console.log(`  Usage: Approve address to transfer specific NFT\n`);

const setApprovalForAll = Selector.fromSignature(
	"setApprovalForAll(address,bool)",
);
console.log(`setApprovalForAll(address,bool)`);
console.log(`  Selector: ${Selector.toHex(setApprovalForAll)}`);
console.log(`  Usage: Approve operator for all NFTs\n`);

const getApproved = Selector.fromSignature("getApproved(uint256)");
console.log(`getApproved(uint256)`);
console.log(`  Selector: ${Selector.toHex(getApproved)}`);
console.log(`  Usage: Get approved address for NFT\n`);

const isApprovedForAll = Selector.fromSignature(
	"isApprovedForAll(address,address)",
);
console.log(`isApprovedForAll(address,address)`);
console.log(`  Selector: ${Selector.toHex(isApprovedForAll)}`);
console.log(`  Usage: Check if operator approved for all\n`);

console.log("--- Query Functions ---\n");

const ownerOf = Selector.fromSignature("ownerOf(uint256)");
console.log(`ownerOf(uint256)`);
console.log(`  Selector: ${Selector.toHex(ownerOf)}`);
console.log(`  Usage: Get owner of NFT\n`);

const balanceOf = Selector.fromSignature("balanceOf(address)");
console.log(`balanceOf(address)`);
console.log(`  Selector: ${Selector.toHex(balanceOf)}`);
console.log(`  Usage: Get NFT count owned by address\n`);

console.log("--- Metadata Functions ---\n");

const tokenURI = Selector.fromSignature("tokenURI(uint256)");
console.log(`tokenURI(uint256)`);
console.log(`  Selector: ${Selector.toHex(tokenURI)}`);
console.log(`  Usage: Get metadata URI for NFT\n`);

const name = Selector.fromSignature("name()");
console.log(`name()`);
console.log(`  Selector: ${Selector.toHex(name)}`);
console.log(`  Usage: Get collection name\n`);

const symbol = Selector.fromSignature("symbol()");
console.log(`symbol()`);
console.log(`  Selector: ${Selector.toHex(symbol)}`);
console.log(`  Usage: Get collection symbol\n`);

console.log("--- ERC721 Enumerable Extension ---\n");

const totalSupply = Selector.fromSignature("totalSupply()");
console.log(`totalSupply()`);
console.log(`  Selector: ${Selector.toHex(totalSupply)}`);
console.log(`  Usage: Get total NFT supply\n`);

const tokenByIndex = Selector.fromSignature("tokenByIndex(uint256)");
console.log(`tokenByIndex(uint256)`);
console.log(`  Selector: ${Selector.toHex(tokenByIndex)}`);
console.log(`  Usage: Get token ID by global index\n`);

const tokenOfOwnerByIndex = Selector.fromSignature(
	"tokenOfOwnerByIndex(address,uint256)",
);
console.log(`tokenOfOwnerByIndex(address,uint256)`);
console.log(`  Selector: ${Selector.toHex(tokenOfOwnerByIndex)}`);
console.log(`  Usage: Get token ID by owner index\n`);

console.log("=== Comparing ERC20 vs ERC721 Selectors ===\n");

const erc20Transfer = Selector.fromSignature("transfer(address,uint256)");
const erc721Transfer = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);

console.log(
	"ERC20 transfer(address,uint256):              ",
	Selector.toHex(erc20Transfer),
);
console.log(
	"ERC721 transferFrom(address,address,uint256): ",
	Selector.toHex(erc721Transfer),
);
console.log(
	"Different signatures = different selectors:",
	!Selector.equals(erc20Transfer, erc721Transfer),
);
