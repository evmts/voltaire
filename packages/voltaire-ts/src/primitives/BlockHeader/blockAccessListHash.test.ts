import { describe, expect, expectTypeOf, it } from "vitest";
import * as BlockAccessList from "../BlockAccessList/index.js";
import type { HashType } from "../Hash/HashType.js";
import * as Hash from "../Hash/index.js";
import * as Hex from "../Hex/index.js";
import * as Rlp from "../Rlp/index.js";
import type { BlockHeaderType, RpcBlockHeader } from "./index.js";
import * as BlockHeader from "./index.js";

// execution-specs tests@v20.0.2, CLZ arbitrary_0 blockchain fixture (Osaka).
const OSAKA_HASH =
	"0x4d464423ae9bdc39153f86b762e0ea0d8c5bb136e9be74af1161f8fd9348ffa1";
const osakaRpc = {
	parentHash:
		"0xcd0d1a95675cf0973973ee5ed2cd0c67c0b5b89fdc04b5319171ada5b591c509",
	sha3Uncles:
		"0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
	miner: "0x2adc25665018aa1fe0e6bc666dac8fc2697ff9ba",
	stateRoot:
		"0xc26d03e498190f3d6fc5c6a84992c5eb374d14e34f38cfc3bf6d917b3e2dd785",
	transactionsRoot:
		"0x10aa979aa50849b94b5371d3fbdb64def3c0aad20bcc3d68619ebe4d44e01dcf",
	receiptsRoot:
		"0x306584c4749bfa876d5f560e143fc9f7b69069e584c87ad3e834bdcab03e3bcc",
	logsBloom: `0x${"00".repeat(256)}`,
	difficulty: "0x00",
	number: "0x01",
	gasLimit: "0x07270e00",
	gasUsed: "0x659b",
	timestamp: "0x03e8",
	extraData: "0x00",
	mixHash: `0x${"00".repeat(32)}`,
	nonce: "0x0000000000000000",
	baseFeePerGas: "0x07",
	withdrawalsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	blobGasUsed: "0x00",
	excessBlobGas: "0x00",
	parentBeaconBlockRoot: `0x${"00".repeat(32)}`,
	requestsHash:
		"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
};

// The Osaka fixture plus the empty block access list commitment as the 22nd
// field. The Zig BlockHeader test asserts the same hash from the same fields.
const amsterdamRpc = {
	...osakaRpc,
	blockAccessListHash: BlockAccessList.EMPTY_BLOCK_ACCESS_LIST_HASH,
};
const AMSTERDAM_HASH =
	"0xedabd207a28a9f76d77deab4c26c5e85e9f18c6dc8d7a2ed8321e653f6bbac85";

describe("EIP-7928 header block access list hash", () => {
	it("types the field as an optional hash", () => {
		expectTypeOf<BlockHeaderType["blockAccessListHash"]>().toEqualTypeOf<
			HashType | undefined
		>();
		expectTypeOf<RpcBlockHeader["blockAccessListHash"]>().toEqualTypeOf<
			string | undefined
		>();
	});

	it("preserves the RPC field and hashes it as the 22nd RLP field", () => {
		const header = BlockHeader.fromRpc(amsterdamRpc);
		expect(header.blockAccessListHash).toEqual(
			Hash.from(amsterdamRpc.blockAccessListHash),
		);
		expect(Hash.toHex(BlockHeader.calculateHash(header))).toBe(AMSTERDAM_HASH);
	});

	it("leaves a header without the field unchanged", () => {
		const header = BlockHeader.fromRpc(osakaRpc);
		expect(header.blockAccessListHash).toBeUndefined();
		expect("blockAccessListHash" in header).toBe(false);
		expect(Hash.toHex(BlockHeader.calculateHash(header))).toBe(OSAKA_HASH);
	});

	it("accepts byte and hex representations through the public constructor", () => {
		const header = BlockHeader.fromRpc(amsterdamRpc);
		for (const blockAccessListHash of [
			amsterdamRpc.blockAccessListHash,
			Hash.from(amsterdamRpc.blockAccessListHash),
		]) {
			const rebuilt = BlockHeader.from({ ...header, blockAccessListHash });
			expect(Hash.toHex(BlockHeader.calculateHash(rebuilt))).toBe(
				AMSTERDAM_HASH,
			);
		}
	});

	it("commits to the block access list contents", () => {
		const list = BlockAccessList.from([
			{
				address: "0x00000000000000000000000000000000000000aa",
				balanceChanges: [{ blockAccessIndex: 1, postBalance: 1n }],
			},
		]);
		const blockAccessListHash = BlockAccessList.calculateHash(list);
		const header = BlockHeader.from({
			...BlockHeader.fromRpc(osakaRpc),
			blockAccessListHash,
		});
		expect(header.blockAccessListHash).toEqual(blockAccessListHash);
		const hash = Hash.toHex(BlockHeader.calculateHash(header));
		expect(hash).not.toBe(AMSTERDAM_HASH);
		expect(hash).not.toBe(OSAKA_HASH);
	});

	it("rejects a commitment that is not 32 bytes", () => {
		expect(() =>
			BlockHeader.fromRpc({ ...osakaRpc, blockAccessListHash: "0x1234" }),
		).toThrow();
	});

	it("treats null fork fields as absent in RPC headers, constructors, and hashing", () => {
		const absent = {
			baseFeePerGas: undefined,
			withdrawalsRoot: undefined,
			blobGasUsed: undefined,
			excessBlobGas: undefined,
			parentBeaconBlockRoot: undefined,
			requestsHash: undefined,
			blockAccessListHash: undefined,
		};
		const nullSuffix = {
			baseFeePerGas: null,
			withdrawalsRoot: null,
			blobGasUsed: null,
			excessBlobGas: null,
			parentBeaconBlockRoot: null,
			requestsHash: null,
			blockAccessListHash: null,
		};
		const legacy = BlockHeader.fromRpc({ ...osakaRpc, ...absent });
		expect(BlockHeader._fromRpc({ ...osakaRpc, ...nullSuffix })).toEqual(
			legacy,
		);
		expect(BlockHeader._from({ ...legacy, ...nullSuffix })).toEqual(legacy);
		expect(
			BlockHeader.calculateHash({
				...legacy,
				...nullSuffix,
			} as unknown as BlockHeaderType),
		).toEqual(BlockHeader.calculateHash(legacy));
	});

	it("rejects a block access list hash without requestsHash", () => {
		const header = BlockHeader._fromRpc({
			...amsterdamRpc,
			requestsHash: null,
		});
		expect(() => BlockHeader.calculateHash(header)).toThrow(
			"blockAccessListHash requires requestsHash",
		);
	});

	it("rejects requestsHash without parentBeaconBlockRoot", () => {
		const header = BlockHeader._fromRpc({
			...osakaRpc,
			parentBeaconBlockRoot: null,
		});
		expect(() => BlockHeader.calculateHash(header)).toThrow(
			"requestsHash requires parentBeaconBlockRoot",
		);
	});

	it("matches an independently assembled 22-field RLP preimage", () => {
		const q = (hex: string) => {
			// RLP integer: strip leading zero bytes, zero is the empty string.
			const bytes = Hex.toBytes(hex);
			return bytes.subarray(bytes.findIndex((b) => b !== 0) >>> 0);
		};
		const preimage = Rlp.encode([
			Hex.toBytes(amsterdamRpc.parentHash),
			Hex.toBytes(amsterdamRpc.sha3Uncles),
			Hex.toBytes(amsterdamRpc.miner),
			Hex.toBytes(amsterdamRpc.stateRoot),
			Hex.toBytes(amsterdamRpc.transactionsRoot),
			Hex.toBytes(amsterdamRpc.receiptsRoot),
			Hex.toBytes(amsterdamRpc.logsBloom),
			q(amsterdamRpc.difficulty),
			q(amsterdamRpc.number),
			q(amsterdamRpc.gasLimit),
			q(amsterdamRpc.gasUsed),
			q(amsterdamRpc.timestamp),
			Hex.toBytes(amsterdamRpc.extraData),
			Hex.toBytes(amsterdamRpc.mixHash),
			Hex.toBytes(amsterdamRpc.nonce),
			q(amsterdamRpc.baseFeePerGas),
			Hex.toBytes(amsterdamRpc.withdrawalsRoot),
			q(amsterdamRpc.blobGasUsed),
			q(amsterdamRpc.excessBlobGas),
			Hex.toBytes(amsterdamRpc.parentBeaconBlockRoot),
			Hex.toBytes(amsterdamRpc.requestsHash),
			Hex.toBytes(amsterdamRpc.blockAccessListHash),
		]);
		expect(Hash.toHex(Hash.keccak256(preimage))).toBe(AMSTERDAM_HASH);
	});
});
