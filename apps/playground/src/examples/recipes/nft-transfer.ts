import {
	Address,
	Hex,
	Keccak256,
	Secp256k1,
	Transaction,
} from "@tevm/voltaire";

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

// Example: Bored Ape Yacht Club
const nftAddress = Address.fromHex(
	"0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
);
const tokenId = 1234n;

// safeTransferFrom(address,address,uint256)
// This is the recommended method as it checks if recipient can receive NFTs
const safeTransferSelector = Keccak256.selector(
	"safeTransferFrom(address,address,uint256)",
);

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

// safeTransferFrom(address,address,uint256,bytes)
// Allows passing additional data to the receiver
const safeTransferWithDataSelector = Keccak256.selector(
	"safeTransferFrom(address,address,uint256,bytes)",
);

const additionalData = new TextEncoder().encode("Hello from transfer!");

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

// transferFrom(address,address,uint256)
// Warning: Does NOT check if recipient can receive NFTs
const transferFromSelector = Keccak256.selector(
	"transferFrom(address,address,uint256)",
);

const transferFromCalldata = new Uint8Array(4 + 32 + 32 + 32);
transferFromCalldata.set(transferFromSelector, 0);
transferFromCalldata.set(ownerAddress, 4 + 12);
transferFromCalldata.set(recipientAddress, 4 + 32 + 12);
transferFromCalldata.set(tokenIdBytes, 4 + 64);

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
const approveSelector = Keccak256.selector("approve(address,uint256)");
const approveCalldata = new Uint8Array(4 + 32 + 32);
approveCalldata.set(approveSelector, 0);
approveCalldata.set(operatorAddress, 4 + 12);
approveCalldata.set(tokenIdBytes, 4 + 32);
const revokeCalldata = new Uint8Array(4 + 32 + 32);
revokeCalldata.set(approveSelector, 0);
// Zero address already (all zeros)
revokeCalldata.set(tokenIdBytes, 4 + 32);
const setApprovalForAllSelector = Keccak256.selector(
	"setApprovalForAll(address,bool)",
);
const setApprovalCalldata = new Uint8Array(4 + 32 + 32);
setApprovalCalldata.set(setApprovalForAllSelector, 0);
setApprovalCalldata.set(operatorAddress, 4 + 12);
setApprovalCalldata[4 + 32 + 31] = 1; // true
const revokeAllCalldata = new Uint8Array(4 + 32 + 32);
revokeAllCalldata.set(setApprovalForAllSelector, 0);
revokeAllCalldata.set(operatorAddress, 4 + 12);
const ownerOfSelector = Keccak256.selector("ownerOf(uint256)");
const ownerOfCalldata = new Uint8Array(4 + 32);
ownerOfCalldata.set(ownerOfSelector, 0);
ownerOfCalldata.set(tokenIdBytes, 4);
const getApprovedSelector = Keccak256.selector("getApproved(uint256)");
const getApprovedCalldata = new Uint8Array(4 + 32);
getApprovedCalldata.set(getApprovedSelector, 0);
getApprovedCalldata.set(tokenIdBytes, 4);
const isApprovedForAllSelector = Keccak256.selector(
	"isApprovedForAll(address,address)",
);
const isApprovedCalldata = new Uint8Array(4 + 32 + 32);
isApprovedCalldata.set(isApprovedForAllSelector, 0);
isApprovedCalldata.set(ownerAddress, 4 + 12);
isApprovedCalldata.set(operatorAddress, 4 + 32 + 12);

const gasPrice = 50_000_000_000n; // 50 gwei
const estimatedGas = 75_000n;
const costWei = gasPrice * estimatedGas;
const costEth = Number(costWei) / 1e18;
