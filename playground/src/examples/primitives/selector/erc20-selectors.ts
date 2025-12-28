import { Selector } from "voltaire";
const transfer = Selector.fromSignature("transfer(address,uint256)");

const transferFrom = Selector.fromSignature(
	"transferFrom(address,address,uint256)",
);

const approve = Selector.fromSignature("approve(address,uint256)");

const increaseAllowance = Selector.fromSignature(
	"increaseAllowance(address,uint256)",
);

const decreaseAllowance = Selector.fromSignature(
	"decreaseAllowance(address,uint256)",
);

const balanceOf = Selector.fromSignature("balanceOf(address)");

const allowance = Selector.fromSignature("allowance(address,address)");

const totalSupply = Selector.fromSignature("totalSupply()");

const name = Selector.fromSignature("name()");

const symbol = Selector.fromSignature("symbol()");

const decimals = Selector.fromSignature("decimals()");

const selectorMap = new Map([
	[Selector.toHex(transfer), "transfer(address,uint256)"],
	[Selector.toHex(transferFrom), "transferFrom(address,address,uint256)"],
	[Selector.toHex(approve), "approve(address,uint256)"],
	[Selector.toHex(balanceOf), "balanceOf(address)"],
	[Selector.toHex(allowance), "allowance(address,address)"],
]);

const unknownSel = Selector.fromHex("0xa9059cbb");
const signature = selectorMap.get(Selector.toHex(unknownSel));
