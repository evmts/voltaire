import { runBenchSuite } from "../bench-harness.js";
import * as Address from "../primitives/Address/index.js";
import * as Uint from "../primitives/Uint/index.js";
import * as ERC20 from "./ERC20.js";
import * as ERC165 from "./ERC165.js";
import * as ERC721 from "./ERC721.js";
import * as ERC1155 from "./ERC1155.js";

const to = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
const from = Address.fromHex("0x1234567890123456789012345678901234567890");
const amount = Uint.from(1_000_000_000_000_000_000n);
const tokenId = Uint.from(42n);
const transferLog = {
	topics: [
		ERC20.EVENTS.Transfer,
		`0x${"0".repeat(24)}1234567890123456789012345678901234567890`,
		`0x${"0".repeat(24)}742d35cc6634c0532925a3b844bc9e7595f0beb0`,
	],
	data: `0x${1000n.toString(16).padStart(64, "0")}`,
};
const supportsData = `0x${"0".repeat(63)}1`;

await runBenchSuite("voltaire-ts:standards", [
	{ name: "ERC20.encodeTransfer", fn: () => ERC20.encodeTransfer(to, amount) },
	{ name: "ERC20.encodeApprove", fn: () => ERC20.encodeApprove(to, amount) },
	{
		name: "ERC20.encodeTransferFrom",
		fn: () => ERC20.encodeTransferFrom(from, to, amount),
	},
	{ name: "ERC20.encodeBalanceOf", fn: () => ERC20.encodeBalanceOf(to) },
	{
		name: "ERC20.decodeTransferEvent",
		fn: () => ERC20.decodeTransferEvent(transferLog),
	},
	{
		name: "ERC721.encodeTransferFrom",
		fn: () => ERC721.encodeTransferFrom(from, to, tokenId),
	},
	{ name: "ERC721.encodeOwnerOf", fn: () => ERC721.encodeOwnerOf(tokenId) },
	{
		name: "ERC1155.encodeBalanceOf",
		fn: () => ERC1155.encodeBalanceOf(to, tokenId),
	},
	{
		name: "ERC165.encodeSupportsInterface",
		fn: () => ERC165.encodeSupportsInterface(ERC165.INTERFACE_IDS.ERC721),
	},
	{
		name: "ERC165.decodeSupportsInterface",
		fn: () => ERC165.decodeSupportsInterface(supportsData),
	},
]);
