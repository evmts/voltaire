import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
// Address: Creating and validating Ethereum addresses
import { Address } from "../../../src/primitives/Address/index.js";

// Address extends Uint8Array - can use as bytes directly
const addr = Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

// === CREATION METHODS ===
// From various formats
const fromHex = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const fromBytes = Address.fromBytes(new Uint8Array(20));
const fromNumber = Address.fromNumber(0x742d35n);
const fromBase64 = Address.fromBase64("dC01zGY0wFMpJaO4RLxFTkQ49E4=");
const zero = Address.zero();

// From crypto keys
const privateKey = crypto.getRandomValues(new Uint8Array(32));
const publicKey = Secp256k1.derivePublicKey(privateKey);
const fromPubKey = Address.fromPublicKey(publicKey);
const fromPrivKey = Address.fromPrivateKey(privateKey);
const addr2 = Address("0x742d35cc6634c0532925a3b844bc454e4438f44e");
