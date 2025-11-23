/**
 * Generate and inject import map for Voltaire modules
 * Uses Vite's alias resolution to work on any machine
 */
export class ImportMapManager {
	private static generateImportMap() {
		// Use the exact same alias paths as vite.config.ts
		const imports: Record<string, string> = {
			"voltaire/primitives/Address": "voltaire/primitives/Address",
			"voltaire/primitives/Hex": "voltaire/primitives/Hex",
			"voltaire/primitives/Hash": "voltaire/primitives/Hash",
			"voltaire/primitives/RLP": "voltaire/primitives/RLP",
			"voltaire/primitives/ABI": "voltaire/primitives/ABI",
			"voltaire/crypto/Keccak256": "voltaire/crypto/Keccak256",
			"voltaire/crypto/Secp256k1": "voltaire/crypto/Secp256k1",
			"voltaire/crypto/BLS12-381": "voltaire/crypto/BLS12-381",
			"voltaire/crypto/BN254": "voltaire/crypto/BN254",
			"voltaire/crypto/SHA256": "voltaire/crypto/SHA256",
			"voltaire/crypto/Ed25519": "voltaire/crypto/Ed25519",
			"voltaire/crypto/Bip39": "voltaire/crypto/Bip39",
			"voltaire/crypto/HDWallet": "voltaire/crypto/HDWallet",
		};

		return { imports };
	}

	static inject(): void {
		// Check if already injected
		if (document.querySelector('script[type="importmap"]')) {
			return;
		}

		const importMap = this.generateImportMap();
		const script = document.createElement("script");
		script.type = "importmap";
		script.textContent = JSON.stringify(importMap, null, 2);
		document.head.appendChild(script);
	}

	static getImportMap() {
		return this.generateImportMap();
	}
}
