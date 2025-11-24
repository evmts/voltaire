// Test import auto-completion
// Try typing: import * as Address from 'volt
// Should suggest: voltaire/primitives/Address

// Try typing: import * as Keccak from 'voltaire/crypto/
// Should suggest: Keccak256, SHA256, Blake2, etc.

// Try typing: Address.
// Should suggest: from, toHex, fromHex, equals, etc.

import * as Keccak256 from "voltaire/crypto/Keccak256";
import * as Address from "voltaire/primitives/Address";

const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

const hash = Keccak256.hash(addr);
