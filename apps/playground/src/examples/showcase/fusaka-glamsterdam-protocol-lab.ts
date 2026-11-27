import {
	Address,
	Authorization,
	BlockAccessList,
	ExecutionPayloadBid,
	Hardfork,
	Hex,
	Keccak256,
	P256,
	SHA256,
	Secp256k1,
	precompiles,
} from "@tevm/voltaire";

/**
 * Showcase 2: Fusaka / Osaka & Glamsterdam Protocol Lab
 *
 * Interactive protocol primitives across Ethereum's newest upgrades:
 *   1. EIP-7702: EOA Code Delegation (`Authorization`)
 *   2. EIP-7951: `P256VERIFY` Precompile (`0x0100`, Osaka) for Passkeys / WebAuthn
 *   3. EIP-7928: Block-Level Access Lists (`BlockAccessList`, Amsterdam)
 *   4. EIP-7732: Enshrined PBS Builder Commitments (`ExecutionPayloadBid`, Amsterdam)
 */

console.log(`Active default hardfork: ${Hardfork.DEFAULT} (Osaka=${Hardfork.OSAKA}, Amsterdam=${Hardfork.AMSTERDAM})`);

// ============================================================================
// 1. EIP-7702: Authorization (EOA -> Smart Account Delegation)
// ============================================================================
console.log("\n=== 1. EIP-7702 EOA Code Delegation (Authorization) ===");
type SecpPrivateKey = Parameters<typeof Secp256k1.derivePublicKey>[0];
const eoaPrivateKey = Secp256k1.randomPrivateKey() as SecpPrivateKey;
const eoaAddress = Address.fromPublicKey(Secp256k1.derivePublicKey(eoaPrivateKey));
const smartAccountImpl = Address("0x0000000071727De22E5E9d8BAf0edAc6f37da032");

const signedAuth = Authorization.sign(
	{
		chainId: 1n,
		address: smartAccountImpl,
		nonce: 7n,
	},
	eoaPrivateKey,
);
Authorization.validate(signedAuth);
const recoveredAuthority = Authorization.verify(signedAuth);
const authGasCost = Authorization.calculateGasCost([signedAuth], 1);

console.log(`EOA Signer:          ${Address.toChecksummed(eoaAddress)}`);
console.log(`Recovered Authority: ${Address.toChecksummed(recoveredAuthority)}`);
console.log(`Authority Match:     ${Address.equals(eoaAddress, recoveredAuthority)}`);
console.log(`Delegate Contract:   ${Address.toChecksummed(signedAuth.address)}`);
console.log(`Delegation Gas Cost: ${authGasCost} gas (1 empty account)`);
console.log(`Formatted:           ${Authorization.format(signedAuth)}`);

// ============================================================================
// 2. EIP-7951: P256VERIFY Precompile (0x0100, Osaka / Fusaka)
// ============================================================================
console.log("\n=== 2. EIP-7951 P256VERIFY Passkey Precompile (0x0100, Osaka) ===");
const passkeyPriv = P256.randomPrivateKey();
const passkeyPub = P256.derivePublicKey(passkeyPriv); // 64 bytes: qx (32B) || qy (32B)
const webauthnDigest = SHA256.hashString("voltaire:passkey:login:nonce=42");
const passkeySig = P256.sign(webauthnDigest, passkeyPriv);

// Direct curve verification
const directOk = P256.verify(passkeySig, webauthnDigest, passkeyPub);

// Pack exact 160-byte EIP-7951 precompile payload: h[32] || r[32] || s[32] || qx[32] || qy[32]
const p256Input = new Uint8Array(160);
p256Input.set(webauthnDigest, 0);
p256Input.set(passkeySig.r, 32);
p256Input.set(passkeySig.s, 64);
p256Input.set(passkeyPub, 96);

const validExec = precompiles.execute(
	precompiles.PrecompileAddress.P256_VERIFY,
	p256Input,
	100_000n,
	Hardfork.OSAKA,
);

// Flip 1 bit in signature s to verify precompile rejects tampered signature
const tamperedInput = p256Input.slice();
tamperedInput[95] ^= 0x01;
const invalidExec = precompiles.execute(
	precompiles.PrecompileAddress.P256_VERIFY,
	tamperedInput,
	100_000n,
	Hardfork.OSAKA,
);

console.log(`Precompile Address:  ${precompiles.P256VERIFY_ADDRESS}`);
console.log(`Direct P256.verify:  ${directOk}`);
console.log(`Valid precompile:    success=${validExec.success}, gasUsed=${validExec.gasUsed}, output=${Hex.fromBytes(validExec.output)}`);
console.log(`Tampered precompile: success=${invalidExec.success}, gasUsed=${invalidExec.gasUsed}, outputLen=${invalidExec.output.length} (empty = invalid)`);

// ============================================================================
// 3. EIP-7928: Block-Level Access Lists (Amsterdam / Glamsterdam)
// ============================================================================
console.log("\n=== 3. EIP-7928 Block-Level Access List (Amsterdam) ===");
const bal = BlockAccessList.from([
	// Intentionally pass accounts & slots out of order to demonstrate canonical sorting
	{
		address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
		balanceChanges: [{ blockAccessIndex: 1, postBalance: 2_500_000_000_000_000_000n }],
		nonceChanges: [{ blockAccessIndex: 1, newNonce: 12n }],
	},
	{
		address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC (sorts before 0xd8dA...)
		storageChanges: [
			{
				slot: 9n,
				changes: [
					{ blockAccessIndex: 2, newValue: 500_000_000n },
					{ blockAccessIndex: 1, newValue: 1_000_000_000n },
				],
			},
			{
				slot: 2n,
				changes: [{ blockAccessIndex: 1, newValue: 42n }],
			},
		],
		storageReads: [100n, 3n],
	},
]);

BlockAccessList.assertValid(bal);
const balRlp = BlockAccessList.toRlp(bal);
const balRoundTrip = BlockAccessList.fromRlp(balRlp);
const balHash = BlockAccessList.calculateHash(bal);

console.log(`Accounts (sorted):   ${bal.map((a) => Address.toChecksummed(a.address)).join(" < ")}`);
console.log(`USDC slots (sorted): [${bal[0].storageChanges.map((s) => s.slot.toString()).join(", ")}]`);
console.log(`RLP Encoded Size:    ${balRlp.length} bytes (round-trip accounts=${balRoundTrip.length})`);
console.log(`blockAccessListHash: ${Hex.fromBytes(balHash)}`);

// ============================================================================
// 4. EIP-7732: Enshrined PBS ExecutionPayloadBid (Amsterdam / Gloas)
// ============================================================================
console.log("\n=== 4. EIP-7732 ePBS ExecutionPayloadBid (Glamsterdam) ===");
const bid = ExecutionPayloadBid.from({
	parentBlockHash: Hex.fromBytes(Keccak256.hashString("parent-exec-block")),
	parentBlockRoot: Hex.fromBytes(Keccak256.hashString("parent-beacon-root")),
	blockHash: Hex.fromBytes(Keccak256.hashString("committed-exec-block-1048576")),
	prevRandao: Hex.fromBytes(Keccak256.hashString("randao-mix-slot-1048576")),
	feeRecipient: "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
	gasLimit: 60_000_000n,
	builderIndex: 42n,
	slot: 1_048_576n,
	value: 85_000_000n, // 0.085 ETH in Gwei paid on beacon chain
	executionPayment: 15_000_000n, // 0.015 ETH in Gwei paid on EL
	blobKzgCommitments: [new Uint8Array(48).fill(0xab)],
	executionRequestsRoot: Hex.fromBytes(Keccak256.hashString("execution-requests-root")),
});

const signedBid = ExecutionPayloadBid.fromSigned({
	message: bid,
	signature: new Uint8Array(96).fill(0xcd), // 96-byte BLS12-381 signature placeholder
});

console.log(`Slot / Builder:      slot=${signedBid.message.slot} builderIndex=#${signedBid.message.builderIndex}`);
console.log(`Gas Limit:           ${signedBid.message.gasLimit.toLocaleString("en-US")} gas`);
console.log(`Proposer Payment:    ${signedBid.message.value} Gwei (CL) + ${signedBid.message.executionPayment} Gwei (EL)`);
console.log(`Blob Commitments:    ${signedBid.message.blobKzgCommitments.length} × ${signedBid.message.blobKzgCommitments[0].length} B`);
console.log(`BLS Signature Size:  ${signedBid.signature.length} bytes`);
