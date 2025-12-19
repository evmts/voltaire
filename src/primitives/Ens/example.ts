/**
 * ENS (Ethereum Name Service) Example
 *
 * Demonstrates ENS normalization, validation, namehash, and labelhash operations.
 */

import * as Hex from "../Hex/index.js";
import * as Ens from "./index.js";
const normalized = Ens.normalize("VITALIK.eth");

try {
	Ens.validate("vitalik.eth");
} catch (err) {}
const hash = Ens.namehash("vitalik.eth");
const labelHash = Ens.labelhash("vitalik");
const subdomainHash = Ens.namehash("sub.vitalik.eth");
const rootHash = Ens.namehash("");
// Expected: 0x0000000000000000000000000000000000000000000000000000000000000000
