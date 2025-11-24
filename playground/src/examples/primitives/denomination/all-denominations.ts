import * as Wei from "../../../primitives/Denomination/Wei.js";
import * as Gwei from "../../../primitives/Denomination/Gwei.js";
import * as Ether from "../../../primitives/Denomination/Ether.js";
import * as Uint from "../../../primitives/Uint/index.js";

// Example: All Ethereum denominations (wei, kwei, mwei, gwei, szabo, finney, ether)

console.log("=== Complete Ethereum Denomination System ===\n");

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

console.log("Denomination hierarchy (wei per unit):");
console.log("1 wei     =", DENOMINATION_FACTORS.wei.toString(), "wei");
console.log("1 kwei    =", DENOMINATION_FACTORS.kwei.toString(), "wei");
console.log("1 mwei    =", DENOMINATION_FACTORS.mwei.toString(), "wei");
console.log("1 gwei    =", DENOMINATION_FACTORS.gwei.toString(), "wei");
console.log("1 szabo   =", DENOMINATION_FACTORS.szabo.toString(), "wei");
console.log("1 finney  =", DENOMINATION_FACTORS.finney.toString(), "wei");
console.log("1 ether   =", DENOMINATION_FACTORS.ether.toString(), "wei");

console.log("\n=== Converting 1 Ether to All Denominations ===\n");

const oneEtherInWei = Wei.from(1_000_000_000_000_000_000n);

console.log("1 ether equals:");
console.log(
	Uint.dividedBy(
		Wei.toU256(oneEtherInWei),
		Uint.from(DENOMINATION_FACTORS.wei),
	).toString(),
	"wei",
);
console.log(
	Uint.dividedBy(
		Wei.toU256(oneEtherInWei),
		Uint.from(DENOMINATION_FACTORS.kwei),
	).toString(),
	"kwei",
);
console.log(
	Uint.dividedBy(
		Wei.toU256(oneEtherInWei),
		Uint.from(DENOMINATION_FACTORS.mwei),
	).toString(),
	"mwei",
);
console.log(
	Uint.dividedBy(
		Wei.toU256(oneEtherInWei),
		Uint.from(DENOMINATION_FACTORS.gwei),
	).toString(),
	"gwei",
);
console.log(
	Uint.dividedBy(
		Wei.toU256(oneEtherInWei),
		Uint.from(DENOMINATION_FACTORS.szabo),
	).toString(),
	"szabo",
);
console.log(
	Uint.dividedBy(
		Wei.toU256(oneEtherInWei),
		Uint.from(DENOMINATION_FACTORS.finney),
	).toString(),
	"finney",
);
console.log(
	Uint.dividedBy(
		Wei.toU256(oneEtherInWei),
		Uint.from(DENOMINATION_FACTORS.ether),
	).toString(),
	"ether",
);

console.log("\n=== Converting Between Different Denominations ===\n");

// Kwei examples
const tenKwei = Wei.from(10_000n);
console.log("10,000 wei = 10 kwei");
console.log(
	"10 kwei =",
	Uint.dividedBy(
		Wei.toU256(tenKwei),
		Uint.from(DENOMINATION_FACTORS.gwei / DENOMINATION_FACTORS.kwei),
	).toString(),
	"gwei (rounded)",
);

// Mwei examples
const fiveMwei = Wei.from(5_000_000n);
console.log("\n5,000,000 wei = 5 mwei");
console.log(
	"5 mwei =",
	Uint.dividedBy(
		Wei.toU256(fiveMwei),
		Uint.from(DENOMINATION_FACTORS.gwei / DENOMINATION_FACTORS.mwei),
	).toString(),
	"gwei (rounded)",
);

// Szabo examples (microether)
const oneSzabo = Wei.from(1_000_000_000_000n);
console.log("\n1,000,000,000,000 wei = 1 szabo (microether)");
console.log(
	"1 szabo =",
	Uint.dividedBy(
		Wei.toU256(oneSzabo),
		Uint.from(DENOMINATION_FACTORS.gwei),
	).toString(),
	"gwei",
);
console.log(
	"1 szabo =",
	Uint.dividedBy(
		Wei.toU256(oneSzabo),
		Uint.from(DENOMINATION_FACTORS.ether / DENOMINATION_FACTORS.szabo),
	).toString(),
	"ether (rounded)",
);

// Finney examples (milliether)
const oneFinney = Wei.from(1_000_000_000_000_000n);
console.log("\n1,000,000,000,000,000 wei = 1 finney (milliether)");
console.log(
	"1 finney =",
	Uint.dividedBy(
		Wei.toU256(oneFinney),
		Uint.from(DENOMINATION_FACTORS.gwei),
	).toString(),
	"gwei",
);
console.log(
	"1 finney =",
	Uint.dividedBy(
		Wei.toU256(oneFinney),
		Uint.from(DENOMINATION_FACTORS.ether / DENOMINATION_FACTORS.finney),
	).toString(),
	"ether (rounded)",
);

console.log("\n=== Historical Names ===\n");

console.log("Alternative names:");
console.log("kwei  = babbage  (1,000 wei)");
console.log("mwei  = lovelace (1,000,000 wei)");
console.log("gwei  = shannon  (1,000,000,000 wei)");
console.log("szabo = microether (0.000001 ether)");
console.log("finney = milliether (0.001 ether)");

console.log("\n=== Common Usage ===\n");

console.log("Most commonly used:");
console.log("- wei: Smart contract calculations, precise values");
console.log("- gwei: Gas prices (standard unit)");
console.log("- ether: Human-readable amounts, wallet displays");

console.log("\nRarely used in practice:");
console.log("- kwei, mwei: Too small for most purposes");
console.log("- szabo, finney: Historical, superseded by gwei/ether");

console.log("\n=== Practical Conversions ===\n");

// Using the built-in types for common conversions
const gasPrice = Gwei.from(30n);
const gasPriceWei = Gwei.toWei(gasPrice);

console.log("Gas price: 30 gwei");
console.log("In wei:", Uint.toString(Wei.toU256(gasPriceWei)));
console.log(
	"In kwei:",
	Uint.dividedBy(
		Wei.toU256(gasPriceWei),
		Uint.from(DENOMINATION_FACTORS.kwei),
	).toString(),
);
console.log(
	"In mwei:",
	Uint.dividedBy(
		Wei.toU256(gasPriceWei),
		Uint.from(DENOMINATION_FACTORS.mwei),
	).toString(),
);

const balance = Ether.from(5n);
const balanceWei = Ether.toWei(balance);

console.log("\nBalance: 5 ether");
console.log("In wei:", Uint.toString(Wei.toU256(balanceWei)));
console.log(
	"In finney:",
	Uint.dividedBy(
		Wei.toU256(balanceWei),
		Uint.from(DENOMINATION_FACTORS.finney),
	).toString(),
);
console.log(
	"In szabo:",
	Uint.dividedBy(
		Wei.toU256(balanceWei),
		Uint.from(DENOMINATION_FACTORS.szabo),
	).toString(),
);
console.log("In gwei:", Uint.toString(Gwei.toU256(Ether.toGwei(balance))));
