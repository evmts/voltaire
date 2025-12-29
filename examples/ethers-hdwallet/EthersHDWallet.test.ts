/**
 * Comprehensive tests for ethers-compatible HD wallet
 * Uses BIP-39/BIP-32 test vectors for validation
 */

import { describe, it, expect, beforeAll } from "vitest";
import { HDNodeWallet as EthersHDNodeWallet, Mnemonic as EthersMnemonic } from "ethers";
import {
	HDNodeWallet,
	HDNodeVoidWallet,
	Mnemonic,
	defaultPath,
	getAccountPath,
	getIndexedAccountPath,
	LangEn,
} from "./index.js";

// BIP-39 Test Vector (from spec)
const TEST_MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const TEST_SEED =
	"0x5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4";
const TEST_ENTROPY = "0x00000000000000000000000000000000";

// Derived addresses from test vector
const EXPECTED_ADDRESS_PATH_0 = "0x9858EfFD232B4033E47d90003D41EC34EcaEda94";
const EXPECTED_PRIVATE_KEY_PATH_0 =
	"0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727";

describe("Mnemonic", () => {
	describe("fromPhrase", () => {
		it("creates mnemonic from valid phrase", () => {
			const mnemonic = Mnemonic.fromPhrase(TEST_MNEMONIC);
			expect(mnemonic.phrase).toBe(TEST_MNEMONIC);
			expect(mnemonic.password).toBe("");
			expect(mnemonic.entropy).toBe(TEST_ENTROPY);
		});

		it("creates mnemonic with password", () => {
			const mnemonic = Mnemonic.fromPhrase(TEST_MNEMONIC, "TREZOR");
			expect(mnemonic.password).toBe("TREZOR");
		});

		it("throws on invalid phrase", () => {
			expect(() => Mnemonic.fromPhrase("invalid mnemonic phrase")).toThrow();
		});

		it("normalizes whitespace", () => {
			const phraseWithExtraSpace = TEST_MNEMONIC.replace(/ /g, "  ");
			const mnemonic = Mnemonic.fromPhrase(phraseWithExtraSpace);
			expect(mnemonic.phrase).toBe(TEST_MNEMONIC);
		});
	});

	describe("fromEntropy", () => {
		it("creates mnemonic from 16 bytes (12 words)", () => {
			const entropy = new Uint8Array(16);
			const mnemonic = Mnemonic.fromEntropy(entropy);
			expect(mnemonic.phrase.split(" ").length).toBe(12);
		});

		it("creates mnemonic from 32 bytes (24 words)", () => {
			const entropy = new Uint8Array(32);
			const mnemonic = Mnemonic.fromEntropy(entropy);
			expect(mnemonic.phrase.split(" ").length).toBe(24);
		});

		it("creates mnemonic from hex string", () => {
			const mnemonic = Mnemonic.fromEntropy(TEST_ENTROPY);
			expect(mnemonic.phrase).toBe(TEST_MNEMONIC);
		});

		it("throws on invalid entropy length", () => {
			expect(() => Mnemonic.fromEntropy(new Uint8Array(15))).toThrow();
			expect(() => Mnemonic.fromEntropy(new Uint8Array(33))).toThrow();
		});
	});

	describe("computeSeed", () => {
		it("computes correct seed", () => {
			const mnemonic = Mnemonic.fromPhrase(TEST_MNEMONIC);
			const seed = mnemonic.computeSeed();
			expect(seed.length).toBe(64);
			const seedHex =
				"0x" +
				Array.from(seed)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join("");
			expect(seedHex.toLowerCase()).toBe(TEST_SEED.toLowerCase());
		});
	});

	describe("static utilities", () => {
		it("isValidMnemonic validates correctly", () => {
			expect(Mnemonic.isValidMnemonic(TEST_MNEMONIC)).toBe(true);
			expect(Mnemonic.isValidMnemonic("invalid phrase")).toBe(false);
		});

		it("entropyToPhrase converts correctly", () => {
			const phrase = Mnemonic.entropyToPhrase(TEST_ENTROPY);
			expect(phrase).toBe(TEST_MNEMONIC);
		});

		it("phraseToEntropy converts correctly", () => {
			const entropy = Mnemonic.phraseToEntropy(TEST_MNEMONIC);
			expect(entropy.toLowerCase()).toBe(TEST_ENTROPY.toLowerCase());
		});
	});
});

describe("HDNodeWallet", () => {
	describe("fromPhrase", () => {
		it("creates wallet from phrase with default path", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			expect(wallet.path).toBe(defaultPath);
			expect(wallet.depth).toBe(5); // m/44'/60'/0'/0/0 = 5 levels
		});

		it("derives correct address", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			expect(wallet.address.toLowerCase()).toBe(
				EXPECTED_ADDRESS_PATH_0.toLowerCase(),
			);
		});

		it("derives correct private key", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			expect(wallet.privateKey.toLowerCase()).toBe(
				EXPECTED_PRIVATE_KEY_PATH_0.toLowerCase(),
			);
		});

		it("supports custom path", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC, "", "m/44'/60'/0'/0/1");
			expect(wallet.path).toBe("m/44'/60'/0'/0/1");
			expect(wallet.index).toBe(1);
		});

		it("matches ethers derivation", () => {
			const voltaireWallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			const ethersWallet = EthersHDNodeWallet.fromPhrase(TEST_MNEMONIC);

			expect(voltaireWallet.address.toLowerCase()).toBe(
				ethersWallet.address.toLowerCase()
			);
			expect(voltaireWallet.privateKey.toLowerCase()).toBe(
				ethersWallet.privateKey.toLowerCase()
			);
		});
	});

	describe("fromMnemonic", () => {
		it("creates wallet from Mnemonic instance", () => {
			const mnemonic = Mnemonic.fromPhrase(TEST_MNEMONIC);
			const wallet = HDNodeWallet.fromMnemonic(mnemonic);
			expect(wallet.mnemonic).toBe(mnemonic);
			expect(wallet.address.toLowerCase()).toBe(
				EXPECTED_ADDRESS_PATH_0.toLowerCase(),
			);
		});
	});

	describe("fromSeed", () => {
		it("creates wallet from seed bytes", () => {
			const mnemonic = Mnemonic.fromPhrase(TEST_MNEMONIC);
			const seed = mnemonic.computeSeed();
			const wallet = HDNodeWallet.fromSeed(seed);
			expect(wallet.path).toBe("m");
			expect(wallet.depth).toBe(0);
		});

		it("throws on invalid seed length", () => {
			expect(() => HDNodeWallet.fromSeed(new Uint8Array(15))).toThrow();
			expect(() => HDNodeWallet.fromSeed(new Uint8Array(65))).toThrow();
		});
	});

	describe("fromExtendedKey", () => {
		it("creates wallet from xprv", () => {
			const original = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			const xprv = original.extendedKey;
			const restored = HDNodeWallet.fromExtendedKey(xprv);
			expect(restored.address.toLowerCase()).toBe(
				original.address.toLowerCase(),
			);
			expect(restored.privateKey.toLowerCase()).toBe(
				original.privateKey.toLowerCase(),
			);
		});

		it("creates void wallet from xpub", () => {
			const original = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			const xpub = original.neuter().extendedKey;
			const restored = HDNodeWallet.fromExtendedKey(xpub);
			expect(restored).toBeInstanceOf(HDNodeVoidWallet);
			expect(restored.address.toLowerCase()).toBe(
				original.address.toLowerCase(),
			);
		});
	});

	describe("createRandom", () => {
		it("creates random wallet", () => {
			const wallet = HDNodeWallet.createRandom();
			expect(wallet.mnemonic).not.toBeNull();
			expect(wallet.mnemonic?.phrase.split(" ").length).toBe(12);
			expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});
	});

	describe("derivePath", () => {
		it("derives child from path", () => {
			const root = HDNodeWallet.fromSeed(Mnemonic.fromPhrase(TEST_MNEMONIC).computeSeed());
			const child = root.derivePath("m/44'/60'/0'/0/0");
			expect(child.address.toLowerCase()).toBe(
				EXPECTED_ADDRESS_PATH_0.toLowerCase(),
			);
		});

		it("derives relative path", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC, "", "m/44'/60'/0'/0");
			const child = wallet.derivePath("0");
			expect(child.address.toLowerCase()).toBe(
				EXPECTED_ADDRESS_PATH_0.toLowerCase(),
			);
		});

		it("throws on invalid path", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			expect(() => wallet.derivePath("invalid")).toThrow();
		});
	});

	describe("deriveChild", () => {
		it("derives child by index", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC, "", "m/44'/60'/0'/0");
			const child = wallet.deriveChild(0);
			expect(child.index).toBe(0);
			expect(child.depth).toBe(wallet.depth + 1);
		});

		it("derives hardened child", () => {
			const root = HDNodeWallet.fromSeed(Mnemonic.fromPhrase(TEST_MNEMONIC).computeSeed());
			const child = root.deriveChild(0x80000000 + 44); // 44'
			expect(child.index).toBe(0x80000000 + 44);
		});

		it("throws on invalid index", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			expect(() => wallet.deriveChild(-1)).toThrow();
			expect(() => wallet.deriveChild(0x100000000)).toThrow();
		});
	});

	describe("neuter", () => {
		it("creates public-only wallet", () => {
			const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
			const neutered = wallet.neuter();
			expect(neutered).toBeInstanceOf(HDNodeVoidWallet);
			expect(neutered.address).toBe(wallet.address);
			expect(neutered.publicKey).toBe(wallet.publicKey);
		});
	});

	describe("properties", () => {
		let wallet: InstanceType<typeof HDNodeWallet>;

		beforeAll(() => {
			wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
		});

		it("has correct fingerprint format", () => {
			expect(wallet.fingerprint).toMatch(/^0x[0-9a-f]{8}$/);
		});

		it("has correct chainCode format", () => {
			expect(wallet.chainCode).toMatch(/^0x[0-9a-f]{64}$/);
		});

		it("has correct publicKey format", () => {
			expect(wallet.publicKey).toMatch(/^0x[0-9a-f]{66}$/);
		});

		it("hasPath returns true", () => {
			expect(wallet.hasPath()).toBe(true);
		});
	});
});

describe("HDNodeVoidWallet", () => {
	let voidWallet: InstanceType<typeof HDNodeVoidWallet>;

	beforeAll(() => {
		const wallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
		voidWallet = wallet.neuter();
	});

	it("cannot derive hardened children", () => {
		expect(() => voidWallet.deriveChild(0x80000000)).toThrow();
	});

	it("cannot derive hardened path", () => {
		expect(() => voidWallet.derivePath("0'")).toThrow();
	});

	it("can derive non-hardened children", () => {
		const child = voidWallet.deriveChild(0);
		expect(child).toBeInstanceOf(HDNodeVoidWallet);
	});

	it("has extendedKey (xpub)", () => {
		expect(voidWallet.extendedKey).toMatch(/^xpub/);
	});
});

describe("Helper Functions", () => {
	describe("getAccountPath", () => {
		it("returns Ledger-style path", () => {
			expect(getAccountPath(0)).toBe("m/44'/60'/0'/0/0");
			expect(getAccountPath(1)).toBe("m/44'/60'/1'/0/0");
			expect(getAccountPath(5)).toBe("m/44'/60'/5'/0/0");
		});

		it("throws on invalid index", () => {
			expect(() => getAccountPath(-1)).toThrow();
			expect(() => getAccountPath(0x80000000)).toThrow();
		});
	});

	describe("getIndexedAccountPath", () => {
		it("returns MetaMask-style path", () => {
			expect(getIndexedAccountPath(0)).toBe("m/44'/60'/0'/0/0");
			expect(getIndexedAccountPath(1)).toBe("m/44'/60'/0'/0/1");
			expect(getIndexedAccountPath(5)).toBe("m/44'/60'/0'/0/5");
		});

		it("throws on invalid index", () => {
			expect(() => getIndexedAccountPath(-1)).toThrow();
		});
	});

	describe("defaultPath", () => {
		it("is correct", () => {
			expect(defaultPath).toBe("m/44'/60'/0'/0/0");
		});
	});
});

describe("Wordlist", () => {
	const wordlist = LangEn.wordlist();

	it("has correct locale", () => {
		expect(wordlist.locale).toBe("en");
	});

	it("splits phrases correctly", () => {
		const words = wordlist.split("abandon zoo");
		expect(words).toEqual(["abandon", "zoo"]);
	});

	it("joins words correctly", () => {
		const phrase = wordlist.join(["abandon", "zoo"]);
		expect(phrase).toBe("abandon zoo");
	});

	it("gets word by index", () => {
		expect(wordlist.getWord(0)).toBe("abandon");
		expect(wordlist.getWord(2047)).toBe("zoo");
	});

	it("gets index by word", () => {
		expect(wordlist.getWordIndex("abandon")).toBe(0);
		expect(wordlist.getWordIndex("zoo")).toBe(2047);
	});

	it("returns -1 for unknown words", () => {
		expect(wordlist.getWordIndex("notaword")).toBe(-1);
	});
});

describe("Ethers Compatibility", () => {
	it("produces same addresses as ethers for multiple accounts", () => {
		for (let i = 0; i < 5; i++) {
			const path = `m/44'/60'/0'/0/${i}`;
			const voltaireWallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC, "", path);
			const ethersWallet = EthersHDNodeWallet.fromPhrase(TEST_MNEMONIC, "", path);

			expect(voltaireWallet.address.toLowerCase()).toBe(
				ethersWallet.address.toLowerCase(),
			);
		}
	});

	it("produces same extended keys as ethers", () => {
		const voltaireWallet = HDNodeWallet.fromPhrase(TEST_MNEMONIC);
		const ethersWallet = EthersHDNodeWallet.fromPhrase(TEST_MNEMONIC);

		expect(voltaireWallet.extendedKey).toBe(ethersWallet.extendedKey);
	});

	it("Mnemonic produces same entropy/phrase conversions", () => {
		const voltaireMnemonic = Mnemonic.fromPhrase(TEST_MNEMONIC);
		const ethersMnemonic = EthersMnemonic.fromPhrase(TEST_MNEMONIC);

		expect(voltaireMnemonic.entropy.toLowerCase()).toBe(
			ethersMnemonic.entropy.toLowerCase(),
		);
	});
});
