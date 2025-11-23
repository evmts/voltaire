/**
 * Pre-import all Voltaire modules so they're available for dynamic execution
 */
import * as Address from 'voltaire/primitives/Address';
import * as Hex from 'voltaire/primitives/Hex';
import * as Hash from 'voltaire/primitives/Hash';
import * as RLP from 'voltaire/primitives/RLP';
import * as ABI from 'voltaire/primitives/ABI';
import * as Keccak256 from 'voltaire/crypto/Keccak256';
import * as Secp256k1 from 'voltaire/crypto/Secp256k1';
import * as SHA256 from 'voltaire/crypto/SHA256';
import * as Blake2 from 'voltaire/crypto/Blake2';
import * as Ripemd160 from 'voltaire/crypto/Ripemd160';
import * as HDWallet from 'voltaire/crypto/HDWallet';

export const modules: Record<string, any> = {
  'voltaire/primitives/Address': Address,
  'voltaire/primitives/Hex': Hex,
  'voltaire/primitives/Hash': Hash,
  'voltaire/primitives/RLP': RLP,
  'voltaire/primitives/ABI': ABI,
  'voltaire/crypto/Keccak256': Keccak256,
  'voltaire/crypto/Secp256k1': Secp256k1,
  'voltaire/crypto/SHA256': SHA256,
  'voltaire/crypto/Blake2': Blake2,
  'voltaire/crypto/Ripemd160': Ripemd160,
  'voltaire/crypto/HDWallet': HDWallet,
};
