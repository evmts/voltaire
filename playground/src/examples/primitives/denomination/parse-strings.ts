import { Ether, Gwei, Uint, Wei } from "voltaire";
// Direct string parsing
const wei1 = Wei.from("1000");
const wei2 = Wei.from("1234567890");
const wei3 = Wei.from("1000000000000000000");

// From bigint strings
const weiFromBigInt = Wei.from("123456789012345678901234567890");

const gwei1 = Gwei.from("5");
const gwei2 = Gwei.from("30");
const gwei3 = Gwei.from("150");
const gwei4 = Gwei.from("1000");

const ether1 = Ether.from("1");
const ether2 = Ether.from("100");
const ether3 = Ether.from("1000");
const ether4 = Ether.from("1000000");

// Numbers that can fit in JavaScript number range
const small1 = Wei.from("21000");
const small2 = Gwei.from("42");
const small3 = Ether.from("5");

// User input simulation
const userInputWei = "1500000000000000000";
const parsedWei = Wei.from(userInputWei);
const asGwei = Wei.toGwei(parsedWei);
const asEther = Wei.toEther(parsedWei);

const userInputGwei = "30";
const parsedGwei = Gwei.from(userInputGwei);
const gweiAsWei = Gwei.toWei(parsedGwei);

const userInputEther = "5";
const parsedEther = Ether.from(userInputEther);
const etherAsWei = Ether.toWei(parsedEther);

// Simulating transaction form input
const txValueStr = "1000000000000000000"; // 1 ether in wei
const gasPriceStr = "30"; // 30 gwei
const gasLimitStr = "21000"; // standard transfer

const txValue = Wei.from(txValueStr);
const gasPrice = Gwei.from(gasPriceStr);
const gasLimit = Number.parseInt(gasLimitStr);

const gasCost = Uint.times(Gwei.toU256(gasPrice), Uint.from(BigInt(gasLimit)));
const totalCost = Uint.plus(Wei.toU256(txValue), gasCost);

// Parse from hex (using Uint, then converting)
const hexWei = "0x0de0b6b3a7640000"; // 1 ether in hex
const parsedHexWei = Wei.from(Uint.fromHex(hexWei as any));

const weiStrings = ["1000", "21000", "1000000000", "1000000000000000000"];
for (const str of weiStrings) {
	const wei = Wei.from(str);
	const ether = Wei.toEther(wei);
}

const gweiStrings = ["5", "10", "30", "50", "100"];
for (const str of gweiStrings) {
	const gwei = Gwei.from(str);
	const wei = Gwei.toWei(gwei);
}

// Valid inputs
const validInputs = ["0", "1", "1000", "999999999999999999999999"];
for (const input of validInputs) {
	try {
		const wei = Wei.from(input);
	} catch (e) {}
}

function parseAndConvert(value: string, fromUnit: string) {
	if (fromUnit === "wei") {
		const wei = Wei.from(value);
	} else if (fromUnit === "gwei") {
		const gwei = Gwei.from(value);
	} else if (fromUnit === "ether") {
		const ether = Ether.from(value);
	}
}

parseAndConvert("1000000000000000000", "wei");
parseAndConvert("30", "gwei");
parseAndConvert("5", "ether");
