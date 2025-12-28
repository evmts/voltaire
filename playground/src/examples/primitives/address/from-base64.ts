import { Address } from "voltaire";
// Example: Create address from base64
// Useful for some APIs that encode addresses in base64
const base64 = "dC01zGY0wFMpJaO4RLxFTkQ49E4=";

const addr = Address.fromBase64(base64);

// Encode address to base64
const instance = Address.Address("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
const encoded = instance.toBase64();

// Round-trip
const roundTrip = Address.fromBase64(encoded);
