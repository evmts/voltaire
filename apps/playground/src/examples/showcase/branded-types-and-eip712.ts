import {
	Address,
	Domain,
	EIP712,
	Ether,
	Gwei,
	Hex,
	Secp256k1,
	Wei,
} from "@tevm/voltaire";

/**
 * Showcase 4: Branded Type & Denomination Safety + EIP-712
 *
 * Demonstrates Voltaire's nominal branded-type guarantees:
 *   1. Compile-time denomination safety (`Wei`, `Gwei`, `Ether` cannot be accidentally mixed)
 *   2. Boundary-validated `Address` brands with canonical 20-byte `Uint8Array` equality
 *   3. EIP-712 structured typed-data signing, signer recovery, and tamper rejection
 */

type BrandedWei = ReturnType<typeof Wei>;
type BrandedAddr = ReturnType<typeof Address.fromHex>;

// ============================================================================
// 1. Compile-Time Denomination Safety (Wei / Gwei / Ether)
// ============================================================================
console.log("=== 1. Branded Denomination Safety (Wei / Gwei / Ether) ===");

// Strongly typed helper: only accepts branded Wei (never raw bigint, Gwei, or Ether!)
function calculateMaxTxCostWei(
	valueWei: BrandedWei,
	gasLimit: bigint,
	maxFeePerGasWei: BrandedWei,
): BrandedWei {
	return Wei(valueWei + gasLimit * maxFeePerGasWei);
}

const sendAmountEth = Ether(2n); // 2 ETH (branded Ether)
const maxFeeGwei = Gwei(28n); // 28 Gwei (branded Gwei)
const gasLimit = 65_000n;

// Explicit, self-documenting conversions to Wei
const valueWei = Ether.toWei(sendAmountEth);
const maxFeeWei = Gwei.toWei(maxFeeGwei);
const totalCostWei = calculateMaxTxCostWei(valueWei, gasLimit, maxFeeWei);

// Compile-time safety guarantee (uncommenting either line fails TypeScript typecheck!):
// calculateMaxTxCostWei(sendAmountEth, gasLimit, maxFeeWei); // TS Error: Ether is not assignable to Wei
// calculateMaxTxCostWei(valueWei, gasLimit, maxFeeGwei);     // TS Error: Gwei is not assignable to Wei

console.log(`Transfer Value:   ${sendAmountEth} ETH = ${valueWei} Wei`);
console.log(`Max Fee Per Gas:  ${maxFeeGwei} Gwei = ${maxFeeWei} Wei`);
console.log(`Gas Budget:       ${gasLimit.toLocaleString("en-US")} gas × ${maxFeeGwei} Gwei = ${gasLimit * maxFeeWei} Wei`);
console.log(`Total Max Cost:   ${totalCostWei} Wei (~${Wei.toGwei(totalCostWei)} Gwei)`);

// ============================================================================
// 2. Boundary-Validated Address Brands
// ============================================================================
console.log("\n=== 2. Validated Address Brands & Byte Equality ===");

function formatTransferSummary(from: BrandedAddr, to: BrandedAddr, amountWei: BrandedWei): string {
	return `${Address.toShortHex(from)} -> ${Address.toShortHex(to)} (${amountWei} Wei)`;
}

const lowercaseAddr = Address.fromHex("0xd8da6bf26964af9d7eed9e03e53415d37aa96045");
const checksummedAddr = Address.fromHex("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
const treasuryAddr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

console.log(`Same bytes across casing: ${Address.equals(lowercaseAddr, checksummedAddr)}`);
console.log(`EIP-55 Checksummed:       ${Address.toChecksummed(lowercaseAddr)}`);
console.log(`Formatted Transfer:       ${formatTransferSummary(treasuryAddr, checksummedAddr, valueWei)}`);

// Validation rejects invalid inputs immediately at the boundary
try {
	Address("0xnot-a-valid-address");
} catch (err) {
	const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
	console.log(`Boundary validation caught invalid address: ${msg}`);
}

// ============================================================================
// 3. EIP-712 Typed Data Signing, Recovery & Tamper Detection
// ============================================================================
console.log("\n=== 3. EIP-712 Permit Signing & Recovery ===");

type SecpPrivateKey = Parameters<typeof Secp256k1.derivePublicKey>[0];
const privateKey = Secp256k1.randomPrivateKey() as SecpPrivateKey;
const signerAddress = Address.fromPublicKey(Secp256k1.derivePublicKey(privateKey));

const permitDomain = Domain.from({
	name: "Voltaire Vault",
	version: "1",
	chainId: 1,
	verifyingContract: Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
});

const permitTypedData = {
	domain: permitDomain,
	types: {
		Permit: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
			{ name: "value", type: "uint256" },
			{ name: "nonce", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
	},
	primaryType: "Permit" as const,
	message: {
		owner: signerAddress,
		spender: treasuryAddr,
		value: valueWei,
		nonce: 0n,
		deadline: 1_900_000_000n,
	},
};

const domainSeparator = EIP712.Domain.hash(permitTypedData.domain);
const signingDigest = EIP712.hashTypedData(permitTypedData);
const signature = EIP712.signTypedData(permitTypedData, privateKey);
const recovered = EIP712.recoverAddress(signature, permitTypedData);
const verified = EIP712.verifyTypedData(signature, permitTypedData, signerAddress);

// Tamper test: mutate value by +1 Wei and confirm verification fails
const tamperedTypedData = {
	...permitTypedData,
	message: {
		...permitTypedData.message,
		value: valueWei + 1n,
	},
};
const tamperedVerified = EIP712.verifyTypedData(signature, tamperedTypedData, signerAddress);

console.log(`Domain Separator: ${Hex.fromBytes(domainSeparator)}`);
console.log(`EIP-712 Digest:   ${Hex.fromBytes(signingDigest)}`);
console.log(`Signer Address:   ${Address.toChecksummed(signerAddress)}`);
console.log(`Recovered Signer: ${Address.toChecksummed(recovered)}`);
console.log(`Verified (valid): ${verified}`);
console.log(`Tamper (+1 Wei):  ${tamperedVerified} (expected false)`);
