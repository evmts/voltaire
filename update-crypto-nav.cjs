const fs = require('fs');

const mint = JSON.parse(fs.readFileSync('docs/mint.json', 'utf8'));

// Find Cryptography section
const cryptoIndex = mint.navigation.findIndex(section => section.group === "Cryptography");

if (cryptoIndex === -1) {
  console.error("Could not find Cryptography section");
  process.exit(1);
}

// Replace Cryptography section with use-case-first organization
mint.navigation[cryptoIndex] = {
  "group": "Cryptography",
  "icon": "shield-halved",
  "pages": [
    {
      "group": "Overview",
      "icon": "circle-info",
      "iconType": "solid",
      "pages": [
        "crypto/comparison",
        "crypto/symmetric-encryption-comparison",
        "crypto/wallet-integration"
      ]
    },
    {
      "group": "Hashing & Addresses",
      "icon": "hashtag",
      "iconType": "solid",
      "pages": [
        {
          "group": "Keccak256 (Mainnet Primary)",
          "icon": "shield-halved",
          "iconType": "solid",
          "pages": [
            "crypto/keccak256/index",
            "crypto/keccak256/hash",
            "crypto/keccak256/implementations",
            "crypto/keccak256/hash-methods",
            "crypto/keccak256/ethereum-methods",
            "crypto/keccak256/usage-patterns"
          ]
        },
        {
          "group": "SHA256 (Precompile)",
          "icon": "lock",
          "iconType": "regular",
          "pages": [
            "crypto/sha256/index",
            "crypto/sha256/api-reference",
            "crypto/sha256/comparison",
            "crypto/sha256/security",
            "crypto/sha256/performance",
            "crypto/sha256/test-vectors",
            "crypto/sha256/usage-patterns"
          ]
        },
        {
          "group": "RIPEMD160 (Bitcoin Compatibility)",
          "icon": "fingerprint",
          "iconType": "light",
          "pages": ["crypto/ripemd160/index"]
        },
        {
          "group": "Blake2 (Modern Alternative)",
          "icon": "bolt",
          "iconType": "light",
          "pages": ["crypto/blake2/index"]
        }
      ]
    },
    {
      "group": "Transaction Signing",
      "icon": "signature",
      "iconType": "solid",
      "pages": [
        {
          "group": "Secp256k1 (ECDSA Mainnet)",
          "icon": "key",
          "iconType": "solid",
          "pages": [
            "crypto/secp256k1/index",
            "crypto/secp256k1/signing",
            "crypto/secp256k1/verification",
            "crypto/secp256k1/recovery",
            "crypto/secp256k1/key-derivation",
            "crypto/secp256k1/point-operations",
            "crypto/secp256k1/security",
            "crypto/secp256k1/performance",
            "crypto/secp256k1/test-vectors",
            "crypto/secp256k1/usage-patterns"
          ]
        },
        {
          "group": "EIP-712 (Typed Messages)",
          "icon": "file-signature",
          "iconType": "regular",
          "pages": ["crypto/eip712/index"]
        },
        {
          "group": "Ed25519 (Alternative)",
          "icon": "pen-nib",
          "iconType": "regular",
          "pages": ["crypto/ed25519/index"]
        }
      ]
    },
    {
      "group": "Blob Transactions & Scaling",
      "icon": "layer-group",
      "iconType": "solid",
      "pages": [
        {
          "group": "KZG (EIP-4844 Mainnet)",
          "icon": "file-zipper",
          "iconType": "solid",
          "pages": [
            "crypto/kzg",
            "crypto/kzg/index",
            "crypto/kzg/eip-4844",
            "crypto/kzg/commitments",
            "crypto/kzg/proofs",
            "crypto/kzg/point-evaluation",
            "crypto/kzg/trusted-setup",
            "crypto/kzg/performance",
            "crypto/kzg/test-vectors",
            "crypto/kzg/usage-patterns"
          ]
        },
        {
          "group": "BN254 (L2 zkSNARKs)",
          "icon": "cube",
          "iconType": "light",
          "pages": [
            "crypto/bn254",
            "crypto/bn254/index",
            "crypto/bn254/g1-operations",
            "crypto/bn254/g2-operations",
            "crypto/bn254/pairing",
            "crypto/bn254/precompiles",
            "crypto/bn254/zk-usage",
            "crypto/bn254/performance",
            "crypto/bn254/test-vectors",
            "crypto/bn254/usage-patterns"
          ]
        }
      ]
    },
    {
      "group": "Consensus & Beacon Chain",
      "icon": "tower-broadcast",
      "iconType": "solid",
      "pages": [
        {
          "group": "BLS12-381 (Consensus Only)",
          "icon": "cubes",
          "iconType": "light",
          "pages": [
            "crypto/bls12-381",
            "crypto/bls12-381/index",
            "crypto/bls12-381/signatures",
            "crypto/bls12-381/aggregation",
            "crypto/bls12-381/g1-operations",
            "crypto/bls12-381/g2-operations",
            "crypto/bls12-381/pairing",
            "crypto/bls12-381/precompiles",
            "crypto/bls12-381/security",
            "crypto/bls12-381/performance",
            "crypto/bls12-381/test-vectors",
            "crypto/bls12-381/usage-patterns"
          ]
        }
      ]
    },
    {
      "group": "Wallet Operations",
      "icon": "wallet",
      "iconType": "solid",
      "pages": [
        {
          "group": "BIP39 (Mnemonic Seeds)",
          "icon": "book",
          "iconType": "regular",
          "pages": [
            "crypto/bip39/index",
            "crypto/bip39/generation",
            "crypto/bip39/validation",
            "crypto/bip39/seed-derivation",
            "crypto/bip39/wordlists",
            "crypto/bip39/passphrase",
            "crypto/bip39/security"
          ]
        },
        {
          "group": "HDWallet (Key Derivation)",
          "icon": "folder-tree",
          "iconType": "regular",
          "pages": [
            "crypto/hdwallet/index",
            "crypto/hdwallet/extended-keys",
            "crypto/hdwallet/child-derivation",
            "crypto/hdwallet/derivation-paths"
          ]
        }
      ]
    },
    {
      "group": "Encryption & Key Exchange",
      "icon": "shield",
      "iconType": "solid",
      "pages": [
        {
          "group": "AES-GCM (Symmetric)",
          "icon": "shield",
          "iconType": "regular",
          "pages": [
            "crypto/aesgcm/index",
            "crypto/aesgcm/encryption",
            "crypto/aesgcm/decryption",
            "crypto/aesgcm/security",
            "crypto/aesgcm/test-vectors"
          ]
        },
        {
          "group": "ChaCha20Poly1305 (Symmetric)",
          "icon": "shield-alt",
          "iconType": "regular",
          "pages": ["crypto/chacha20poly1305/index"]
        },
        {
          "group": "X25519 (Key Exchange)",
          "icon": "arrows-left-right",
          "iconType": "regular",
          "pages": ["crypto/x25519/index"]
        },
        {
          "group": "P256 (Hardware Wallets)",
          "icon": "microchip",
          "iconType": "regular",
          "pages": ["crypto/p256/index"]
        }
      ]
    }
  ]
};

fs.writeFileSync('docs/mint.json', JSON.stringify(mint, null, '\t'));
console.log('Successfully updated crypto navigation structure');
