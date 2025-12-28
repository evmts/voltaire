import { Ens, Hex } from "@tevm/voltaire";
const name1 = Ens("vitalik.eth");
const name2 = Ens("nick.eth");
const name3 = Ens("sub.domain.eth");

// Normalize converts to lowercase and canonical form per ENSIP-15
const normalized1 = Ens.normalize("VITALIK.eth");
const normalized2 = Ens.normalize("Nick.ETH");
const normalized3 = Ens.normalize("Sub.Domain.ETH");

// Beautify normalizes but preserves emoji presentation
const beautified1 = Ens.beautify("TEST.eth");
const beautified2 = Ens.beautify("💩.eth");

// Namehash recursively hashes labels from right to left
// namehash(name) = keccak256(namehash(parent) || labelhash(label))
const hash1 = Ens.namehash("vitalik.eth");
const hash2 = Ens.namehash("eth");
const hash3 = Ens.namehash(""); // Root hash (32 zero bytes)

// Labelhash is simply keccak256 of a single label
const label1 = Ens.labelhash("vitalik");
const label2 = Ens.labelhash("eth");
const label3 = Ens.labelhash("sub");

const mainDomain = Ens.namehash("example.eth");
const subdomain = Ens.namehash("sub.example.eth");
const deepSubdomain = Ens.namehash("deep.sub.example.eth");
