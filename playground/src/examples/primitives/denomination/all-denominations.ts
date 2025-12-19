import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Define all denomination conversion factors
const DENOMINATION_FACTORS = {
	wei: 1n,
	kwei: 1_000n, // kilowei / babbage
	mwei: 1_000_000n, // megawei / lovelace
	gwei: 1_000_000_000n, // gigawei / shannon
	szabo: 1_000_000_000_000n, // microether
	finney: 1_000_000_000_000_000n, // milliether
	ether: 1_000_000_000_000_000_000n,
};

const oneEtherInWei = Wei.from(1_000_000_000_000_000_000n);

// Kwei examples
const tenKwei = Wei.from(10_000n);

// Mwei examples
const fiveMwei = Wei.from(5_000_000n);

// Szabo examples (microether)
const oneSzabo = Wei.from(1_000_000_000_000n);

// Finney examples (milliether)
const oneFinney = Wei.from(1_000_000_000_000_000n);

// Using the built-in types for common conversions
const gasPrice = Gwei.from(30n);
const gasPriceWei = Gwei.toWei(gasPrice);

const balance = Ether.from(5n);
const balanceWei = Ether.toWei(balance);
