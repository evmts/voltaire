import { randomBytes } from "node:crypto";
import { bls12_381 } from "@noble/curves/bls12-381.js";

// Honest validator
const honestPrivKey = 12345n;
const honestPubKey = bls12_381.G2.Point.BASE.multiply(honestPrivKey);

// Target victim
const victimPrivKey = 99999n;
const victimPubKey = bls12_381.G2.Point.BASE.multiply(victimPrivKey);

// Attacker creates rogue key
const roguePubKey = victimPubKey.subtract(honestPubKey);

// Aggregate keys
const aggregatedPubKey = honestPubKey.add(roguePubKey);

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
	BigInt(`0x${randomBytes(32).toString("hex")}`) % bls12_381.fields.Fr.ORDER;
const validator1PubKey = bls12_381.G2.Point.BASE.multiply(validator1PrivKey);
const validator1PoP = generatePoP(validator1PrivKey, validator1PubKey);

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

// Try to verify with wrong public key (should fail)
const wrongPubKey = bls12_381.G2.Point.BASE.multiply(54321n);
const wrongValid = verifyPoP(wrongPubKey, validator1PoP);

// Attacker cannot generate valid PoP for rogue key
const roguePopValid = verifyPoP(roguePubKey, validator1PoP);

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

// Deposit contract verifies PoP
const depositPubKey = bls12_381.G2.Point.fromHex(deposit.pubkey);
const depositValid = verifyPoP(depositPubKey, deposit.signature);

const validators = Array.from({ length: 5 }, (_, i) => {
	const privKey = BigInt(10000 + i * 1111);
	const pubKey = bls12_381.G2.Point.BASE.multiply(privKey);
	const pop = generatePoP(privKey, pubKey);
	return { privKey, pubKey, pop };
});
validators.forEach((v, i) => {
	const popValid = verifyPoP(v.pubKey, v.pop);
});

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

const popGenerationTime = 0.1; // ~100 μs
const popVerificationTime = 2; // ~2 ms (2 pairings)
const popSize = 48; // bytes

const DST_POP = "BLS_POP_BLS12381G1_XMD:SHA-256_SSWU_RO_POP_";
const DST_SIG = "BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_";
