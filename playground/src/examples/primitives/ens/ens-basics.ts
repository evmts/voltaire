import * as Ens from "../../../primitives/Ens/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Example: ENS basics - normalization, hashing, and conversions

// ===== 1. ENS Name Creation =====
console.log("\n===== ENS Name Creation =====");

const name1 = Ens.from("vitalik.eth");
const name2 = Ens.from("nick.eth");
const name3 = Ens.from("sub.domain.eth");

console.log("Created ENS names:");
console.log("  name1:", name1);
console.log("  name2:", name2);
console.log("  name3:", name3);

// ===== 2. Name Normalization =====
console.log("\n===== Name Normalization =====");

// Normalize converts to lowercase and canonical form per ENSIP-15
const normalized1 = Ens.normalize("VITALIK.eth");
const normalized2 = Ens.normalize("Nick.ETH");
const normalized3 = Ens.normalize("Sub.Domain.ETH");

console.log("Normalized names:");
console.log("  VITALIK.eth →", normalized1);
console.log("  Nick.ETH →", normalized2);
console.log("  Sub.Domain.ETH →", normalized3);

// ===== 3. Name Beautification =====
console.log("\n===== Name Beautification =====");

// Beautify normalizes but preserves emoji presentation
const beautified1 = Ens.beautify("TEST.eth");
const beautified2 = Ens.beautify("💩.eth");

console.log("Beautified names:");
console.log("  TEST.eth →", beautified1);
console.log("  💩.eth →", beautified2);

// ===== 4. Namehash Algorithm (EIP-137) =====
console.log("\n===== Namehash Algorithm =====");

// Namehash recursively hashes labels from right to left
// namehash(name) = keccak256(namehash(parent) || labelhash(label))
const hash1 = Ens.namehash("vitalik.eth");
const hash2 = Ens.namehash("eth");
const hash3 = Ens.namehash(""); // Root hash (32 zero bytes)

console.log("Namehashes:");
console.log("  vitalik.eth →", Hex.fromBytes(hash1));
console.log("  eth →", Hex.fromBytes(hash2));
console.log("  (empty/root) →", Hex.fromBytes(hash3));

// ===== 5. Labelhash =====
console.log("\n===== Labelhash =====");

// Labelhash is simply keccak256 of a single label
const label1 = Ens.labelhash("vitalik");
const label2 = Ens.labelhash("eth");
const label3 = Ens.labelhash("sub");

console.log("Labelhashes:");
console.log("  vitalik →", Hex.fromBytes(label1));
console.log("  eth →", Hex.fromBytes(label2));
console.log("  sub →", Hex.fromBytes(label3));

// ===== 6. Subdomain Hashing =====
console.log("\n===== Subdomain Hashing =====");

const mainDomain = Ens.namehash("example.eth");
const subdomain = Ens.namehash("sub.example.eth");
const deepSubdomain = Ens.namehash("deep.sub.example.eth");

console.log("Subdomain namehashes:");
console.log("  example.eth →", Hex.fromBytes(mainDomain).slice(0, 18) + "...");
console.log(
	"  sub.example.eth →",
	Hex.fromBytes(subdomain).slice(0, 18) + "...",
);
console.log(
	"  deep.sub.example.eth →",
	Hex.fromBytes(deepSubdomain).slice(0, 18) + "...",
);
