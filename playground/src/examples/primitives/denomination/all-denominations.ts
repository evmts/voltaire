import { Ether, Gwei, Uint, Wei } from "@tevm/voltaire";
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

const oneEtherInWei = Wei(1_000_000_000_000_000_000n);

// Kwei examples
const tenKwei = Wei(10_000n);

// Mwei examples
const fiveMwei = Wei(5_000_000n);

// Szabo examples (microether)
const oneSzabo = Wei(1_000_000_000_000n);

// Finney examples (milliether)
const oneFinney = Wei(1_000_000_000_000_000n);

// Using the built-in types for common conversions
const gasPrice = Gwei(30n);
const gasPriceWei = Gwei.toWei(gasPrice);

const balance = Ether(5n);
const balanceWei = Ether.toWei(balance);
