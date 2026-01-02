/**
 * ENS (Ethereum Name Service) Example
 *
 * Demonstrates ENS normalization, validation, namehash, and labelhash operations.
 */

import * as Ens from "./index.js";

const _normalized = Ens.normalize("VITALIK.eth");

try {
	Ens.validate("vitalik.eth");
} catch (_err) {}
const _hash = Ens.namehash("vitalik.eth");
const _labelHash = Ens.labelhash("vitalik");
const _subdomainHash = Ens.namehash("sub.vitalik.eth");
const _rootHash = Ens.namehash("");
// Expected: 0x0000000000000000000000000000000000000000000000000000000000000000
