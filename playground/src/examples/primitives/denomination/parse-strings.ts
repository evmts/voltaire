import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";
// Direct string parsing
const wei1 = Wei("1000");
const wei2 = Wei("1234567890");
const wei3 = Wei("1000000000000000000");

// From bigint strings
const weiFromBigInt = Wei("123456789012345678901234567890");

const gwei1 = Gwei("5");
const gwei2 = Gwei("30");
const gwei3 = Gwei("150");
const gwei4 = Gwei("1000");

const ether1 = Ether("1");
const ether2 = Ether("100");
const ether3 = Ether("1000");
const ether4 = Ether("1000000");

// Numbers that can fit in JavaScript number range
const small1 = Wei("21000");
const small2 = Gwei("42");
const small3 = Ether("5");

// User input simulation
const userInputWei = "1500000000000000000";
const parsedWei = Wei(userInputWei);
const asGwei = Wei.toGwei(parsedWei);
const asEther = Wei.toEther(parsedWei);

const userInputGwei = "30";
const parsedGwei = Gwei(userInputGwei);
const gweiAsWei = Gwei.toWei(parsedGwei);

const userInputEther = "5";
const parsedEther = Ether(userInputEther);
const etherAsWei = Ether.toWei(parsedEther);

// Simulating transaction form input
const txValueStr = "1000000000000000000"; // 1 ether in wei
const gasPriceStr = "30"; // 30 gwei
const gasLimitStr = "21000"; // standard transfer

const txValue = Wei(txValueStr);
const gasPrice = Gwei(gasPriceStr);
const gasLimit = Number.parseInt(gasLimitStr);

const gasCost = Uint.times(Gwei.toU256(gasPrice), Uint(BigInt(gasLimit)));
const totalCost = Uint.plus(Wei.toU256(txValue), gasCost);

// Parse from hex (using Uint, then converting)
const hexWei = "0x0de0b6b3a7640000"; // 1 ether in hex
const parsedHexWei = Wei(Uint.fromHex(hexWei as any));

const weiStrings = ["1000", "21000", "1000000000", "1000000000000000000"];
for (const str of weiStrings) {
	const wei = Wei(str);
	const ether = Wei.toEther(wei);
}

const gweiStrings = ["5", "10", "30", "50", "100"];
for (const str of gweiStrings) {
	const gwei = Gwei(str);
	const wei = Gwei.toWei(gwei);
}

// Valid inputs
const validInputs = ["0", "1", "1000", "999999999999999999999999"];
for (const input of validInputs) {
	try {
		const wei = Wei(input);
	} catch (e) {}
}

function parseAndConvert(value: string, fromUnit: string) {
	if (fromUnit === "wei") {
		const wei = Wei(value);
	} else if (fromUnit === "gwei") {
		const gwei = Gwei(value);
	} else if (fromUnit === "ether") {
		const ether = Ether(value);
	}
}

parseAndConvert("1000000000000000000", "wei");
parseAndConvert("30", "gwei");
parseAndConvert("5", "ether");
