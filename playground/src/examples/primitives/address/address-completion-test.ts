import { Address, Keccak256 } from "voltaire";
// Test import auto-completion
// Try typing: import * as Address from 'volt
// Should suggest: voltaire/primitives/Address

// Try typing: import * as Keccak from 'voltaire/crypto/
// Should suggest: Keccak256, SHA256, Blake2, etc.

// Try typing: Address.
// Should suggest: from, toHex, fromHex, equals, etc.

const addr = Address.from("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");

const hash = Keccak256.hash(addr);
