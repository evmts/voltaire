import { Selector } from "voltaire";
const sel1 = Selector.fromSignature("transfer(address,uint256)");
const sel2 = Selector.fromSignature("transfer(address,uint256)");
const sel3 = Selector.fromHex("0xa9059cbb");

const transfer = Selector.fromSignature("transfer(address,uint256)");
const approve = Selector.fromSignature("approve(address,uint256)");
const transferFrom = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);

const safeTransferFrom3 = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256)",
);
const safeTransferFrom4 = Selector.fromSignature(
	"safeTransferFrom(address,address,uint256,bytes)",
);

const mintUint = Selector.fromSignature("mint(uint256)");
const mintAddress = Selector.fromSignature("mint(address)");

const burn0 = Selector.fromSignature("burn()");
const burn1 = Selector.fromSignature("burn(uint256)");
const burn2 = Selector.fromSignature("burn(address,uint256)");

const erc20Sels = new Set([
	Selector.toHex(Selector.fromSignature("transfer(address,uint256)")),
	Selector.toHex(Selector.fromSignature("approve(address,uint256)")),
	Selector.toHex(
		Selector.fromSignature("transferFrom(address,address,uint256)"),
	),
	Selector.toHex(Selector.fromSignature("balanceOf(address)")),
	Selector.toHex(Selector.fromSignature("allowance(address,address)")),
]);

const erc721Sels = new Set([
	Selector.toHex(
		Selector.fromSignature("safeTransferFrom(address,address,uint256)"),
	),
	Selector.toHex(
		Selector.fromSignature("transferFrom(address,address,uint256)"),
	),
	Selector.toHex(Selector.fromSignature("approve(address,uint256)")),
	Selector.toHex(Selector.fromSignature("ownerOf(uint256)")),
	Selector.toHex(Selector.fromSignature("tokenURI(uint256)")),
]);

// Find overlap
const overlap = new Set([...erc20Sels].filter((sel) => erc721Sels.has(sel)));
for (const sel of overlap) {
}

function isERC20Call(calldata: string): boolean {
	if (calldata.length < 10) return false;
	const sel = Selector.toHex(Selector.from(calldata.slice(0, 10)));
	return erc20Sels.has(sel);
}

function isERC721Call(calldata: string): boolean {
	if (calldata.length < 10) return false;
	const sel = Selector.toHex(Selector.from(calldata.slice(0, 10)));
	return erc721Sels.has(sel);
}

const testCalldata = `0xa9059cbb${"0".repeat(128)}`; // transfer calldata

const upperHex = Selector.fromHex("0xA9059CBB");
const lowerHex = Selector.fromHex("0xa9059cbb");
