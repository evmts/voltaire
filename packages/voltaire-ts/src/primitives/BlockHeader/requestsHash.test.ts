import { describe, expect, it } from "vitest";
import * as Hash from "../Hash/index.js";
import * as BlockHeader from "./index.js";

// execution-specs tests@v20.0.2, CLZ arbitrary_0 blockchain fixture.
// Archive SHA-256: 1280540950a4c3470a421416b6f35458a9b635827265c29e5aef1ae839ae1788.
const rpcHeader = {
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
	logsBloom:
		"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
	difficulty: "0x00",
	number: "0x01",
	gasLimit: "0x07270e00",
	gasUsed: "0x659b",
	timestamp: "0x03e8",
	extraData: "0x00",
	mixHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
	nonce: "0x0000000000000000",
	baseFeePerGas: "0x07",
	withdrawalsRoot:
		"0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
	blobGasUsed: "0x00",
	excessBlobGas: "0x00",
	parentBeaconBlockRoot:
		"0x0000000000000000000000000000000000000000000000000000000000000000",
	requestsHash:
		"0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
};

describe("EIP-7685 header requests hash", () => {
	it("preserves the RPC field and matches the upstream Osaka block hash", () => {
		const header = BlockHeader.fromRpc(rpcHeader);
		expect(header.requestsHash).toEqual(Hash.from(rpcHeader.requestsHash));
		expect(BlockHeader.calculateHash(header)).toEqual(
			Hash.from(
				"0x4d464423ae9bdc39153f86b762e0ea0d8c5bb136e9be74af1161f8fd9348ffa1",
			),
		);
	});
	it("accepts branded byte and hex representations through the public constructor", () => {
		const header = BlockHeader.fromRpc(rpcHeader);
		for (const requestsHash of [
			rpcHeader.requestsHash,
			Hash.from(rpcHeader.requestsHash),
		]) {
			const rebuilt = BlockHeader.from({ ...header, requestsHash });
			expect(rebuilt.requestsHash).toEqual(Hash.from(rpcHeader.requestsHash));
			expect(BlockHeader.calculateHash(rebuilt)).toEqual(
				BlockHeader.calculateHash(header),
			);
		}
	});
	it("keeps earlier headers without a requests commitment", () => {
		const { requestsHash: _requestsHash, ...cancunRpc } = rpcHeader;
		const header = BlockHeader.fromRpc(cancunRpc);
		expect(header.requestsHash).toBeUndefined();
		expect(BlockHeader.calculateHash(header)).not.toEqual(
			Hash.from(
				"0x4d464423ae9bdc39153f86b762e0ea0d8c5bb136e9be74af1161f8fd9348ffa1",
			),
		);
	});
});
