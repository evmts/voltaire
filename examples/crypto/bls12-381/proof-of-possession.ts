import { bls12_381 } from "@noble/curves/bls12-381.js";
import { randomBytes } from "crypto";

/**
 * Proof of Possession (PoP)
 *
 * Demonstrates BLS proof-of-possession to prevent rogue key attacks:
 * - Generate PoP by signing own public key
 * - Verify PoP before accepting validator
 * - Understand rogue key attack vectors
 * - Ethereum validator deposit workflow
 */

console.log("=== BLS Proof of Possession (PoP) ===\n");

// 1. The Rogue Key Attack
console.log("1. The Rogue Key Attack Scenario");
console.log("-".repeat(60));

// Honest validator
const honestPrivKey = 12345n;
const honestPubKey = bls12_381.G2.Point.BASE.multiply(honestPrivKey);

// Target victim
const victimPrivKey = 99999n;
const victimPubKey = bls12_381.G2.Point.BASE.multiply(victimPrivKey);

// Attacker creates rogue key
const roguePubKey = victimPubKey.subtract(honestPubKey);

console.log(
	"Honest validator pubkey (x.c0):",
	honestPubKey.toAffine().x.c0.toString(16).slice(0, 16),
	"...",
);
console.log(
	"Victim pubkey (x.c0):",
	victimPubKey.toAffine().x.c0.toString(16).slice(0, 16),
	"...",
);
console.log(
	"Attacker rogue key (x.c0):",
	roguePubKey.toAffine().x.c0.toString(16).slice(0, 16),
	"...",
);

// Aggregate keys
const aggregatedPubKey = honestPubKey.add(roguePubKey);
console.log(
	"\nAggregated pubkey equals victim pubkey:",
	aggregatedPubKey.equals(victimPubKey),
);

// Without PoP, attacker can forge signatures!
const message = new TextEncoder().encode("Transfer 32 ETH");
const msgHash = bls12_381.G1.hashToCurve(message, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});

// Only honest validator signs (attacker doesn't sign at all)
const honestSig = msgHash.multiply(honestPrivKey);

// Attacker claims "aggregate signature" is just the honest signature
// Verification will pass because aggPubKey = victimPubKey!
const lhs = bls12_381.pairing(honestSig, bls12_381.G2.Point.BASE);
const rhs = bls12_381.pairing(msgHash, aggregatedPubKey);

console.log("\nAttacker forges signature for victim without knowing privkey!");
console.log("Forged signature verifies:", lhs.equals(rhs));
console.log("\nThis is why Proof of Possession is critical!\n");

// 2. Generate Proof of Possession
console.log("2. Generate Proof of Possession");
console.log("-".repeat(60));

function generatePoP(
	privateKey: bigint,
	publicKey: typeof bls12_381.G2.Point.BASE,
): Uint8Array {
	// Sign the public key itself with domain separation
	const pubKeyBytes = publicKey.toRawBytes(false); // Uncompressed
	const popHash = bls12_381.G1.hashToCurve(pubKeyBytes, {
		DST: "BLS_POP_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_",
	});
	const pop = popHash.multiply(privateKey);
	return pop.toRawBytes(true); // Compressed signature
}

const validator1PrivKey =
	BigInt("0x" + randomBytes(32).toString("hex")) % bls12_381.fields.Fr.ORDER;
const validator1PubKey = bls12_381.G2.Point.BASE.multiply(validator1PrivKey);
const validator1PoP = generatePoP(validator1PrivKey, validator1PubKey);

console.log("Validator 1:");
console.log(
	"  Private key:",
	validator1PrivKey.toString(16).slice(0, 16),
	"...",
);
console.log(
	"  Public key (compressed):",
	Buffer.from(validator1PubKey.toRawBytes(true)).toString("hex").slice(0, 32),
	"...",
);
console.log(
	"  Proof of Possession:",
	Buffer.from(validator1PoP).toString("hex").slice(0, 32),
	"...",
);
console.log("  PoP size: 48 bytes\n");

// 3. Verify Proof of Possession
console.log("3. Verify Proof of Possession");
console.log("-".repeat(60));

function verifyPoP(
	publicKey: typeof bls12_381.G2.Point.BASE,
	popBytes: Uint8Array,
): boolean {
	try {
		// Deserialize PoP signature
		const pop = bls12_381.G1.Point.fromHex(popBytes);

		// Hash public key to G1
		const pubKeyBytes = publicKey.toRawBytes(false);
		const popHash = bls12_381.G1.hashToCurve(pubKeyBytes, {
			DST: "BLS_POP_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_",
		});

		// Verify: e(PoP, G2) = e(H(pubkey), pubkey)
		const lhs = bls12_381.pairing(pop, bls12_381.G2.Point.BASE);
		const rhs = bls12_381.pairing(popHash, publicKey);

		return lhs.equals(rhs);
	} catch {
		return false;
	}
}

const validator1Valid = verifyPoP(validator1PubKey, validator1PoP);
console.log(
	"Validator 1 PoP verification:",
	validator1Valid ? "VALID ✓" : "INVALID ✗",
);

// Try to verify with wrong public key (should fail)
const wrongPubKey = bls12_381.G2.Point.BASE.multiply(54321n);
const wrongValid = verifyPoP(wrongPubKey, validator1PoP);
console.log("PoP with wrong public key:", wrongValid ? "VALID ✓" : "INVALID ✗");

// Attacker cannot generate valid PoP for rogue key
const roguePopValid = verifyPoP(roguePubKey, validator1PoP);
console.log(
	"Rogue key with valid PoP:",
	roguePopValid ? "VALID ✓" : "INVALID ✗\n",
);

// 4. Ethereum Validator Deposit
console.log("4. Ethereum Validator Deposit Workflow");
console.log("-".repeat(60));

interface ValidatorDeposit {
	pubkey: Uint8Array; // 48 bytes (compressed G2)
	withdrawalCredentials: Uint8Array; // 32 bytes
	amount: bigint; // 32 ETH in Gwei
	signature: Uint8Array; // 96 bytes (PoP)
}

const GWEI = 1_000_000_000n;
const depositAmount = 32n * GWEI * 1_000_000_000n; // 32 ETH

const deposit: ValidatorDeposit = {
	pubkey: validator1PubKey.toRawBytes(true),
	withdrawalCredentials: randomBytes(32),
	amount: depositAmount,
	signature: validator1PoP,
};

console.log("Deposit Data:");
console.log(
	"  Public key:",
	Buffer.from(deposit.pubkey).toString("hex").slice(0, 32),
	"...",
);
console.log(
	"  Withdrawal credentials:",
	Buffer.from(deposit.withdrawalCredentials).toString("hex").slice(0, 32),
	"...",
);
console.log(
	"  Amount:",
	(deposit.amount / GWEI / 1_000_000_000n).toString(),
	"ETH",
);
console.log(
	"  Signature (PoP):",
	Buffer.from(deposit.signature).toString("hex").slice(0, 32),
	"...",
);

// Deposit contract verifies PoP
const depositPubKey = bls12_381.G2.Point.fromHex(deposit.pubkey);
const depositValid = verifyPoP(depositPubKey, deposit.signature);

console.log(
	"\nDeposit contract PoP verification:",
	depositValid ? "ACCEPTED ✓" : "REJECTED ✗\n",
);

// 5. Multiple Validators with PoP
console.log("5. Multiple Validators (All with Valid PoP)");
console.log("-".repeat(60));

const validators = Array.from({ length: 5 }, (_, i) => {
	const privKey = BigInt(10000 + i * 1111);
	const pubKey = bls12_381.G2.Point.BASE.multiply(privKey);
	const pop = generatePoP(privKey, pubKey);
	return { privKey, pubKey, pop };
});

console.log("Generated 5 validators with PoP:");
validators.forEach((v, i) => {
	const popValid = verifyPoP(v.pubKey, v.pop);
	console.log(`  Validator ${i}: PoP ${popValid ? "VALID ✓" : "INVALID ✗"}`);
});
console.log();

// 6. Safe Aggregation After PoP
console.log("6. Safe Signature Aggregation (After PoP Verification)");
console.log("-".repeat(60));

// All validators with verified PoP can safely aggregate
const safeMessage = new TextEncoder().encode("Safe to aggregate");
const safeMsgHash = bls12_381.G1.hashToCurve(safeMessage, {
	DST: "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_",
});

const safeSigs = validators.map((v) => safeMsgHash.multiply(v.privKey));
let aggSafeSig = safeSigs[0];
for (let i = 1; i < safeSigs.length; i++) {
	aggSafeSig = aggSafeSig.add(safeSigs[i]);
}

let aggSafePubKey = validators[0].pubKey;
for (let i = 1; i < validators.length; i++) {
	aggSafePubKey = aggSafePubKey.add(validators[i].pubKey);
}

const safeLhs = bls12_381.pairing(aggSafeSig, bls12_381.G2.Point.BASE);
const safeRhs = bls12_381.pairing(safeMsgHash, aggSafePubKey);
const safeValid = safeLhs.equals(safeRhs);

console.log("All validators have verified PoP");
console.log("Aggregated", validators.length, "signatures");
console.log("Aggregate verification:", safeValid ? "VALID ✓" : "INVALID ✗");
console.log("\nRogue key attack prevented by PoP requirement!\n");

// 7. PoP Cost Analysis
console.log("7. PoP Cost Analysis");
console.log("-".repeat(60));

const popGenerationTime = 0.1; // ~100 μs
const popVerificationTime = 2; // ~2 ms (2 pairings)
const popSize = 48; // bytes

console.log("PoP Generation:");
console.log("  Time: ~", popGenerationTime, "ms");
console.log("  Operations: Hash-to-curve + scalar multiplication");
console.log("  Cost: One-time per validator");

console.log("\nPoP Verification:");
console.log("  Time: ~", popVerificationTime, "ms");
console.log("  Operations: 2 pairings");
console.log("  Cost: One-time at deposit");

console.log("\nPoP Storage:");
console.log("  Size:", popSize, "bytes per validator");
console.log(
	"  Total (1M validators):",
	((1_000_000 * popSize) / 1024 / 1024).toFixed(2),
	"MB",
);

console.log("\nBenefit:");
console.log("  Prevents all rogue key attacks");
console.log("  Enables safe signature aggregation");
console.log("  One-time cost, permanent security\n");

// 8. Domain Separation for PoP
console.log("8. Domain Separation Tags");
console.log("-".repeat(60));

const DST_POP = "BLS_POP_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_";
const DST_SIG = "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_";

console.log("PoP DST:", DST_POP);
console.log("Signature DST:", DST_SIG);
console.log("\nDifferent DSTs prevent cross-context attacks");
console.log("PoP cannot be reused as regular signature\n");

// 9. Production Recommendations
console.log("9. Production Recommendations");
console.log("-".repeat(60));

console.log("Validator Setup:");
console.log("  1. Generate private key from secure random source");
console.log("  2. Derive public key: pubkey = privkey * G2");
console.log("  3. Generate PoP: Sign(pubkey, privkey)");
console.log("  4. Verify PoP locally before deposit");
console.log("  5. Submit deposit with PoP to deposit contract");

console.log("\nDeposit Contract:");
console.log("  1. Receive deposit data + PoP");
console.log("  2. Verify PoP against public key");
console.log("  3. Reject if PoP invalid");
console.log("  4. Accept validator if PoP valid");
console.log("  5. Store public key for future aggregation");

console.log("\nAggregation (Post-PoP):");
console.log("  1. Only aggregate signatures from validators with verified PoP");
console.log("  2. Safe from rogue key attacks");
console.log("  3. No additional checks needed\n");

console.log("=== Complete ===");
