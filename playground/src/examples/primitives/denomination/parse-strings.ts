import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: Parsing denomination values from strings

console.log("=== Parsing Wei from Strings ===\n");

// Direct string parsing
const wei1 = Wei.from("1000");
const wei2 = Wei.from("1234567890");
const wei3 = Wei.from("1000000000000000000");

console.log("Parsed wei values:");
console.log('"1000" =>', Uint.toString(Wei.toU256(wei1)), "wei");
console.log('"1234567890" =>', Uint.toString(Wei.toU256(wei2)), "wei");
console.log('"1000000000000000000" =>', Uint.toString(Wei.toU256(wei3)), "wei");

// From bigint strings
const weiFromBigInt = Wei.from("123456789012345678901234567890");
console.log("\nLarge value:");
console.log(
	'"123456789012345678901234567890" =>',
	Uint.toString(Wei.toU256(weiFromBigInt)),
	"wei",
);

console.log("\n=== Parsing Gwei from Strings ===\n");

const gwei1 = Gwei.from("5");
const gwei2 = Gwei.from("30");
const gwei3 = Gwei.from("150");
const gwei4 = Gwei.from("1000");

console.log("Parsed gwei values:");
console.log('"5" =>', Uint.toString(Gwei.toU256(gwei1)), "gwei");
console.log('"30" =>', Uint.toString(Gwei.toU256(gwei2)), "gwei");
console.log('"150" =>', Uint.toString(Gwei.toU256(gwei3)), "gwei");
console.log('"1000" =>', Uint.toString(Gwei.toU256(gwei4)), "gwei");

console.log("\n=== Parsing Ether from Strings ===\n");

const ether1 = Ether.from("1");
const ether2 = Ether.from("100");
const ether3 = Ether.from("1000");
const ether4 = Ether.from("1000000");

console.log("Parsed ether values:");
console.log('"1" =>', Uint.toString(Ether.toU256(ether1)), "ether");
console.log('"100" =>', Uint.toString(Ether.toU256(ether2)), "ether");
console.log('"1000" =>', Uint.toString(Ether.toU256(ether3)), "ether");
console.log('"1000000" =>', Uint.toString(Ether.toU256(ether4)), "ether");

console.log("\n=== Parsing from Number Strings ===\n");

// Numbers that can fit in JavaScript number range
const small1 = Wei.from("21000");
const small2 = Gwei.from("42");
const small3 = Ether.from("5");

console.log("Small number strings:");
console.log('"21000" wei =>', Uint.toString(Wei.toU256(small1)));
console.log('"42" gwei =>', Uint.toString(Gwei.toU256(small2)));
console.log('"5" ether =>', Uint.toString(Ether.toU256(small3)));

console.log("\n=== Converting String Input ===\n");

// User input simulation
const userInputWei = "1500000000000000000";
const parsedWei = Wei.from(userInputWei);
const asGwei = Wei.toGwei(parsedWei);
const asEther = Wei.toEther(parsedWei);

console.log("User entered:", userInputWei, "wei");
console.log("As gwei:", Uint.toString(Gwei.toU256(asGwei)));
console.log("As ether:", Uint.toString(Ether.toU256(asEther)));

const userInputGwei = "30";
const parsedGwei = Gwei.from(userInputGwei);
const gweiAsWei = Gwei.toWei(parsedGwei);

console.log("\nUser entered:", userInputGwei, "gwei");
console.log("As wei:", Uint.toString(Wei.toU256(gweiAsWei)));

const userInputEther = "5";
const parsedEther = Ether.from(userInputEther);
const etherAsWei = Ether.toWei(parsedEther);

console.log("\nUser entered:", userInputEther, "ether");
console.log("As wei:", Uint.toString(Wei.toU256(etherAsWei)));

console.log("\n=== Parsing Transaction Parameters ===\n");

// Simulating transaction form input
const txValueStr = "1000000000000000000"; // 1 ether in wei
const gasPriceStr = "30"; // 30 gwei
const gasLimitStr = "21000"; // standard transfer

const txValue = Wei.from(txValueStr);
const gasPrice = Gwei.from(gasPriceStr);
const gasLimit = Number.parseInt(gasLimitStr);

console.log("Transaction parameters:");
console.log("Value:", Uint.toString(Wei.toU256(txValue)), "wei");
console.log(
	"      ",
	Uint.toString(Ether.toU256(Wei.toEther(txValue))),
	"ether",
);
console.log("Gas price:", Uint.toString(Gwei.toU256(gasPrice)), "gwei");
console.log("Gas limit:", gasLimit);

const gasCost = Uint.times(Gwei.toU256(gasPrice), Uint.from(BigInt(gasLimit)));
const totalCost = Uint.plus(Wei.toU256(txValue), gasCost);

console.log("Gas cost:", Uint.toString(gasCost), "gwei");
console.log("Total:", Uint.toString(totalCost), "wei");
console.log(
	"      ",
	Uint.toString(Ether.toU256(Wei.toEther(totalCost as Wei.Type))),
	"ether",
);

console.log("\n=== Parsing Hex String Amounts ===\n");

// Parse from hex (using Uint, then converting)
const hexWei = "0x0de0b6b3a7640000"; // 1 ether in hex
const parsedHexWei = Wei.from(Uint.fromHex(hexWei as any));

console.log("Hex string:", hexWei);
console.log("As wei:", Uint.toString(Wei.toU256(parsedHexWei)));
console.log(
	"As ether:",
	Uint.toString(Ether.toU256(Wei.toEther(parsedHexWei))),
);

console.log("\n=== Batch Parsing ===\n");

const weiStrings = ["1000", "21000", "1000000000", "1000000000000000000"];

console.log("Parsing multiple wei values:");
for (const str of weiStrings) {
	const wei = Wei.from(str);
	const ether = Wei.toEther(wei);
	console.log(`  "${str}" wei = ${Uint.toString(Ether.toU256(ether))} ether`);
}

const gweiStrings = ["5", "10", "30", "50", "100"];

console.log("\nParsing multiple gwei values:");
for (const str of gweiStrings) {
	const gwei = Gwei.from(str);
	const wei = Gwei.toWei(gwei);
	console.log(`  "${str}" gwei = ${Uint.toString(Wei.toU256(wei))} wei`);
}

console.log("\n=== Validation Examples ===\n");

// Valid inputs
const validInputs = ["0", "1", "1000", "999999999999999999999999"];

console.log("Valid inputs:");
for (const input of validInputs) {
	try {
		const wei = Wei.from(input);
		console.log(
			`  "${input}" => Valid (${Uint.toString(Wei.toU256(wei))} wei)`,
		);
	} catch (e) {
		console.log(`  "${input}" => Invalid`);
	}
}

console.log("\n=== Format Conversion Utility ===\n");

function parseAndConvert(value: string, fromUnit: string) {
	console.log(`Converting "${value}" ${fromUnit}:`);

	if (fromUnit === "wei") {
		const wei = Wei.from(value);
		console.log("  Wei:  ", Uint.toString(Wei.toU256(wei)));
		console.log("  Gwei: ", Uint.toString(Gwei.toU256(Wei.toGwei(wei))));
		console.log("  Ether:", Uint.toString(Ether.toU256(Wei.toEther(wei))));
	} else if (fromUnit === "gwei") {
		const gwei = Gwei.from(value);
		console.log("  Wei:  ", Uint.toString(Wei.toU256(Gwei.toWei(gwei))));
		console.log("  Gwei: ", Uint.toString(Gwei.toU256(gwei)));
		console.log("  Ether:", Uint.toString(Ether.toU256(Gwei.toEther(gwei))));
	} else if (fromUnit === "ether") {
		const ether = Ether.from(value);
		console.log("  Wei:  ", Uint.toString(Wei.toU256(Ether.toWei(ether))));
		console.log("  Gwei: ", Uint.toString(Gwei.toU256(Ether.toGwei(ether))));
		console.log("  Ether:", Uint.toString(Ether.toU256(ether)));
	}
}

parseAndConvert("1000000000000000000", "wei");
console.log();
parseAndConvert("30", "gwei");
console.log();
parseAndConvert("5", "ether");
