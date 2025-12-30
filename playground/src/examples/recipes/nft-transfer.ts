import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
} from "@tevm/voltaire";

// === ERC-721 NFT Transfer Recipe ===
// This recipe demonstrates the complete flow for transferring NFTs
// including safeTransferFrom, transferFrom, and approval patterns

console.log("=== ERC-721 NFT Transfer Recipe ===\n");

// === Step 1: Set up accounts ===
console.log("Step 1: Set up accounts");
console.log("-".repeat(50));

// Owner (current NFT holder)
const ownerPrivateKey = Secp256k1.randomPrivateKey();
const ownerPublicKey = Secp256k1.derivePublicKey(ownerPrivateKey);
const ownerAddress = Address.fromPublicKey(ownerPublicKey);

// Recipient (new owner)
const recipientPrivateKey = Secp256k1.randomPrivateKey();
const recipientPublicKey = Secp256k1.derivePublicKey(recipientPrivateKey);
const recipientAddress = Address.fromPublicKey(recipientPublicKey);

// Operator (approved to manage NFTs)
const operatorAddress = Address.fromHex(
	"0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
);

console.log(`Owner (sender): ${Address.toChecksummed(ownerAddress)}`);
console.log(`Recipient: ${Address.toChecksummed(recipientAddress)}`);
console.log(`Operator: ${Address.toChecksummed(operatorAddress)}`);

// === Step 2: Define the NFT contract ===
console.log("\n\nStep 2: Define the ERC-721 contract");
console.log("-".repeat(50));

// Example: Bored Ape Yacht Club
const nftAddress = Address.fromHex(
	"0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
);
const tokenId = 1234n;

console.log(`NFT Contract: ${Address.toChecksummed(nftAddress)}`);
console.log("Collection: Bored Ape Yacht Club (BAYC)");
console.log(`Token ID: ${tokenId}`);

// ERC-721 function signatures
console.log("\nERC-721 Functions:");
console.log("  - transferFrom(from, to, tokenId)");
console.log("  - safeTransferFrom(from, to, tokenId)");
console.log("  - safeTransferFrom(from, to, tokenId, data)");
console.log("  - approve(to, tokenId)");
console.log("  - setApprovalForAll(operator, approved)");
console.log("  - getApproved(tokenId) -> address");
console.log("  - isApprovedForAll(owner, operator) -> bool");
console.log("  - ownerOf(tokenId) -> address");

// === Step 3: Encode safeTransferFrom (recommended method) ===
console.log("\n\nStep 3: Encode safeTransferFrom");
console.log("-".repeat(50));

// safeTransferFrom(address,address,uint256)
// This is the recommended method as it checks if recipient can receive NFTs
const safeTransferSelector = Keccak256.selector(
	"safeTransferFrom(address,address,uint256)",
);

console.log(`Function: safeTransferFrom(address,address,uint256)`);
console.log(`Selector: ${Hex.fromBytes(safeTransferSelector)}`);

// Encode: selector + from (32) + to (32) + tokenId (32)
const safeTransferCalldata = new Uint8Array(4 + 32 + 32 + 32);

safeTransferCalldata.set(safeTransferSelector, 0);

// From address (left-padded)
safeTransferCalldata.set(ownerAddress, 4 + 12);

// To address (left-padded)
safeTransferCalldata.set(recipientAddress, 4 + 32 + 12);

// TokenId (big-endian uint256)
const tokenIdBytes = new Uint8Array(32);
let tid = tokenId;
for (let i = 31; i >= 0 && tid > 0n; i--) {
	tokenIdBytes[i] = Number(tid & 0xffn);
	tid >>= 8n;
}
safeTransferCalldata.set(tokenIdBytes, 4 + 64);

console.log(`\nEncoded calldata: ${Hex.fromBytes(safeTransferCalldata)}`);

console.log("\nCalldata breakdown:");
console.log(`  Selector: ${Hex.fromBytes(safeTransferCalldata.slice(0, 4))}`);
console.log(`  From: ${Hex.fromBytes(safeTransferCalldata.slice(4, 36))}`);
console.log(`  To: ${Hex.fromBytes(safeTransferCalldata.slice(36, 68))}`);
console.log(`  TokenId: ${Hex.fromBytes(safeTransferCalldata.slice(68, 100))}`);

// === Step 4: Encode safeTransferFrom with data ===
console.log("\n\nStep 4: Encode safeTransferFrom with data");
console.log("-".repeat(50));

// safeTransferFrom(address,address,uint256,bytes)
// Allows passing additional data to the receiver
const safeTransferWithDataSelector = Keccak256.selector(
	"safeTransferFrom(address,address,uint256,bytes)",
);

const additionalData = new TextEncoder().encode("Hello from transfer!");

console.log(`Function: safeTransferFrom(address,address,uint256,bytes)`);
console.log(`Selector: ${Hex.fromBytes(safeTransferWithDataSelector)}`);
console.log(`Additional data: "Hello from transfer!"`);

// Dynamic bytes encoding:
// offset to data (32) + from (32) + to (32) + tokenId (32) + data length (32) + data (padded)
const dataPadded = new Uint8Array(Math.ceil(additionalData.length / 32) * 32);
dataPadded.set(additionalData, 0);

const safeTransferWithDataCalldata = new Uint8Array(
	4 + 32 + 32 + 32 + 32 + 32 + dataPadded.length,
);

let offset = 0;
safeTransferWithDataCalldata.set(safeTransferWithDataSelector, offset);
offset += 4;

// From address
safeTransferWithDataCalldata.set(ownerAddress, offset + 12);
offset += 32;

// To address
safeTransferWithDataCalldata.set(recipientAddress, offset + 12);
offset += 32;

// TokenId
safeTransferWithDataCalldata.set(tokenIdBytes, offset);
offset += 32;

// Offset to bytes data (0x80 = 128 = after the 4 fixed params)
const dataOffsetBytes = new Uint8Array(32);
dataOffsetBytes[31] = 0x80;
safeTransferWithDataCalldata.set(dataOffsetBytes, offset);
offset += 32;

// Data length
const dataLengthBytes = new Uint8Array(32);
dataLengthBytes[31] = additionalData.length;
safeTransferWithDataCalldata.set(dataLengthBytes, offset);
offset += 32;

// Data content
safeTransferWithDataCalldata.set(dataPadded, offset);

console.log(
	`\nEncoded calldata: ${Hex.fromBytes(safeTransferWithDataCalldata)}`,
);

// === Step 5: Encode basic transferFrom ===
console.log("\n\nStep 5: Encode transferFrom (basic, no safety check)");
console.log("-".repeat(50));

// transferFrom(address,address,uint256)
// Warning: Does NOT check if recipient can receive NFTs
const transferFromSelector = Keccak256.selector(
	"transferFrom(address,address,uint256)",
);

console.log(`Function: transferFrom(address,address,uint256)`);
console.log(`Selector: ${Hex.fromBytes(transferFromSelector)}`);

const transferFromCalldata = new Uint8Array(4 + 32 + 32 + 32);
transferFromCalldata.set(transferFromSelector, 0);
transferFromCalldata.set(ownerAddress, 4 + 12);
transferFromCalldata.set(recipientAddress, 4 + 32 + 12);
transferFromCalldata.set(tokenIdBytes, 4 + 64);

console.log(`\nEncoded calldata: ${Hex.fromBytes(transferFromCalldata)}`);
console.log(
	"\nWarning: Use safeTransferFrom unless you know the recipient can receive NFTs",
);

// === Step 6: Create the transaction ===
console.log("\n\nStep 6: Create and sign the transaction");
console.log("-".repeat(50));

const unsignedTx: Transaction.EIP1559 = {
	type: 2,
	chainId: 1n,
	nonce: 0n,
	maxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
	maxFeePerGas: 100_000_000_000n, // 100 gwei
	gasLimit: 150_000n, // NFT transfers need more gas
	to: nftAddress,
	value: 0n,
	data: safeTransferCalldata,
	accessList: [],
};

console.log("Transaction parameters:");
console.log(`  chainId: ${unsignedTx.chainId}`);
console.log(`  nonce: ${unsignedTx.nonce}`);
console.log(
	`  maxPriorityFeePerGas: ${unsignedTx.maxPriorityFeePerGas / 1_000_000_000n} gwei`,
);
console.log(`  maxFeePerGas: ${unsignedTx.maxFeePerGas / 1_000_000_000n} gwei`);
console.log(`  gasLimit: ${unsignedTx.gasLimit}`);
console.log(`  to: ${Address.toChecksummed(nftAddress)}`);

// Sign the transaction
const signingHash = Transaction.getSigningHash(unsignedTx);
const signature = Secp256k1.sign(signingHash, ownerPrivateKey);

const signedTx: Transaction.EIP1559 = {
	...unsignedTx,
	r: signature.r,
	s: signature.s,
	v: BigInt(signature.v - 27),
};

const serialized = Transaction.serialize(signedTx);
console.log(`\nSerialized transaction: ${Hex.fromBytes(serialized)}`);

// === Step 7: Approval patterns ===
console.log("\n\n=== Approval Patterns ===");
console.log("-".repeat(50));

// Approve a specific token
console.log("\n1. Approve specific token:");
const approveSelector = Keccak256.selector("approve(address,uint256)");
const approveCalldata = new Uint8Array(4 + 32 + 32);
approveCalldata.set(approveSelector, 0);
approveCalldata.set(operatorAddress, 4 + 12);
approveCalldata.set(tokenIdBytes, 4 + 32);

console.log(`   approve(operator, tokenId)`);
console.log(`   Calldata: ${Hex.fromBytes(approveCalldata)}`);

// Revoke approval (approve to zero address)
console.log("\n2. Revoke approval:");
const revokeCalldata = new Uint8Array(4 + 32 + 32);
revokeCalldata.set(approveSelector, 0);
// Zero address already (all zeros)
revokeCalldata.set(tokenIdBytes, 4 + 32);

console.log(`   approve(address(0), tokenId)`);
console.log(`   Calldata: ${Hex.fromBytes(revokeCalldata)}`);

// Set approval for all
console.log("\n3. Approve operator for all tokens:");
const setApprovalForAllSelector = Keccak256.selector(
	"setApprovalForAll(address,bool)",
);
const setApprovalCalldata = new Uint8Array(4 + 32 + 32);
setApprovalCalldata.set(setApprovalForAllSelector, 0);
setApprovalCalldata.set(operatorAddress, 4 + 12);
setApprovalCalldata[4 + 32 + 31] = 1; // true

console.log(`   setApprovalForAll(operator, true)`);
console.log(`   Calldata: ${Hex.fromBytes(setApprovalCalldata)}`);

// Revoke approval for all
console.log("\n4. Revoke operator approval:");
const revokeAllCalldata = new Uint8Array(4 + 32 + 32);
revokeAllCalldata.set(setApprovalForAllSelector, 0);
revokeAllCalldata.set(operatorAddress, 4 + 12);
// false = 0 (already all zeros)

console.log(`   setApprovalForAll(operator, false)`);
console.log(`   Calldata: ${Hex.fromBytes(revokeAllCalldata)}`);

// === Step 8: Query functions ===
console.log("\n\n=== Query Functions ===");
console.log("-".repeat(50));

// ownerOf
console.log("\n1. Get owner of token:");
const ownerOfSelector = Keccak256.selector("ownerOf(uint256)");
const ownerOfCalldata = new Uint8Array(4 + 32);
ownerOfCalldata.set(ownerOfSelector, 0);
ownerOfCalldata.set(tokenIdBytes, 4);

console.log(`   ownerOf(tokenId)`);
console.log(`   Calldata: ${Hex.fromBytes(ownerOfCalldata)}`);

// getApproved
console.log("\n2. Get approved address for token:");
const getApprovedSelector = Keccak256.selector("getApproved(uint256)");
const getApprovedCalldata = new Uint8Array(4 + 32);
getApprovedCalldata.set(getApprovedSelector, 0);
getApprovedCalldata.set(tokenIdBytes, 4);

console.log(`   getApproved(tokenId)`);
console.log(`   Calldata: ${Hex.fromBytes(getApprovedCalldata)}`);

// isApprovedForAll
console.log("\n3. Check if operator is approved for all:");
const isApprovedForAllSelector = Keccak256.selector(
	"isApprovedForAll(address,address)",
);
const isApprovedCalldata = new Uint8Array(4 + 32 + 32);
isApprovedCalldata.set(isApprovedForAllSelector, 0);
isApprovedCalldata.set(ownerAddress, 4 + 12);
isApprovedCalldata.set(operatorAddress, 4 + 32 + 12);

console.log(`   isApprovedForAll(owner, operator)`);
console.log(`   Calldata: ${Hex.fromBytes(isApprovedCalldata)}`);

// === Step 9: Gas estimates ===
console.log("\n\n=== Gas Estimates ===");
console.log("-".repeat(50));

console.log("Typical gas usage for ERC-721:");
console.log("  - transferFrom: ~50,000 gas");
console.log("  - safeTransferFrom: ~60,000-80,000 gas");
console.log("  - safeTransferFrom with data: ~70,000-100,000 gas");
console.log("  - approve: ~45,000 gas");
console.log("  - setApprovalForAll: ~45,000 gas");
console.log("\nNote: Actual gas depends on contract implementation");

const gasPrice = 50_000_000_000n; // 50 gwei
const estimatedGas = 75_000n;
const costWei = gasPrice * estimatedGas;
const costEth = Number(costWei) / 1e18;

console.log(`\nExample cost at 50 gwei:`);
console.log(`  Gas used: ~${estimatedGas}`);
console.log(`  Cost: ~${costEth.toFixed(4)} ETH`);

console.log("\n=== Recipe Complete ===");
console.log("\nKey points:");
console.log("1. Use safeTransferFrom to ensure recipient can receive NFTs");
console.log("2. For EOA recipients, either method works");
console.log("3. For contract recipients, use safeTransferFrom");
console.log("4. Check approval status before transferring on behalf of others");
