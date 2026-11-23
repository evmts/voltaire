import { parseAbi } from "abitype";
import { describe, expect, it } from "vitest";
import { Abi } from "./Abi.js";
import { AbiParseError } from "./Errors.js";
import { getSelector as getFunctionSelector } from "./function/index.js";
import { parseHumanReadable } from "./parseHumanReadable.js";

const ERC20 = [
	"function transfer(address to, uint256 amount) returns (bool)",
	"event Transfer(address indexed from, address indexed to, uint256 value)",
	"error InsufficientBalance(uint256 available, uint256 required)",
] as const;

describe("parseHumanReadable", () => {
	it("parses the issue #320 ERC-20 example", () => {
		expect(parseHumanReadable(ERC20)).toEqual([
			{
				type: "function",
				name: "transfer",
				stateMutability: "nonpayable",
				inputs: [
					{ type: "address", name: "to" },
					{ type: "uint256", name: "amount" },
				],
				outputs: [{ type: "bool" }],
			},
			{
				type: "event",
				name: "Transfer",
				inputs: [
					{ type: "address", name: "from", indexed: true },
					{ type: "address", name: "to", indexed: true },
					{ type: "uint256", name: "value" },
				],
			},
			{
				type: "error",
				name: "InsufficientBalance",
				inputs: [
					{ type: "uint256", name: "available" },
					{ type: "uint256", name: "required" },
				],
			},
		]);
	});

	it("matches abitype parseAbi on every supported form", () => {
		const signatures = [
			...ERC20,
			"function balanceOf(address owner) external view returns (uint256)",
			"function pureFn() public pure returns (uint, int)",
			"function deposit() payable",
			"function multi(uint8 a, bytes32 b, bytes c, string s, bool f) returns (address, uint256[])",
			"function nested(uint256[][3] grid, address[2][] pairs)",
			"function tuples((uint256 a, (bool b, string c)[] inner) outer) returns ((uint256, bool))",
			"function locations(string calldata s, bytes memory b, address payable p)",
			"event Anon(uint256 indexed id, bytes data)",
			"event NoArgs()",
			"error Empty()",
			"constructor(address owner, uint256 supply)",
			"constructor() payable",
			"fallback() external",
			"fallback() external payable",
			"receive() external payable",
			"struct Point { uint256 x; uint256 y; }",
			"struct Shape { Point[] points; string name; }",
			"function draw(Shape memory shape, Point[2] corners) view returns (Point)",
		];
		expect(parseHumanReadable(signatures)).toEqual(parseAbi(signatures));
	});

	it("tolerates extra whitespace", () => {
		expect(
			parseHumanReadable([
				"  function   transfer ( address  to ,uint256 amount )  returns ( bool ) ",
			]),
		).toEqual(parseHumanReadable([ERC20[0]]));
	});

	it("accepts the tuple(...) keyword form like (...)", () => {
		expect(
			parseHumanReadable(["function f(tuple(address x, uint8[] y)[2] t)"]),
		).toEqual(parseHumanReadable(["function f((address x, uint8[] y)[2] t)"]));
	});

	it("parses anonymous events", () => {
		expect(
			parseHumanReadable(["event Log(bytes32 indexed topic) anonymous"]),
		).toEqual([
			{
				type: "event",
				name: "Log",
				anonymous: true,
				inputs: [{ type: "bytes32", name: "topic", indexed: true }],
			},
		]);
	});

	it("resolves structs declared after their use", () => {
		const [fn] = parseHumanReadable([
			"function f(Outer o)",
			"struct Outer { Inner inner; }",
			"struct Inner { uint8 v; }",
		]);
		expect(fn).toEqual({
			type: "function",
			name: "f",
			stateMutability: "nonpayable",
			inputs: [
				{
					type: "tuple",
					name: "o",
					components: [
						{
							type: "tuple",
							name: "inner",
							components: [{ type: "uint8", name: "v" }],
						},
					],
				},
			],
			outputs: [],
		});
	});

	it("passes JSON ABI items through unchanged", () => {
		const json = {
			type: "function",
			name: "approve",
			stateMutability: "nonpayable",
			inputs: [
				{ type: "address", name: "spender" },
				{ type: "uint256", name: "amount" },
			],
			outputs: [{ type: "bool" }],
		} as const;
		const items = parseHumanReadable([json, ERC20[0]]);
		expect(items[0]).toBe(json);
		expect(items[1]).toMatchObject({ type: "function", name: "transfer" });
	});

	it.each([
		["function f(foo x)", /Unknown type "foo"/],
		["function f(uint7 x)", /Unknown type "uint7"/],
		["function f(bytes33 x)", /Unknown type "bytes33"/],
		["function f(uint256 indexed x)", /indexed/],
		["function f(uint256 a b)", /Unexpected "b"/],
		["function f(uint256 x", /Unbalanced/],
		["function f(uint256 x) returns (bool) view", /after returns/],
		["function f() override", /Unexpected modifier "override"/],
		["event E(uint256 x) foo", /Unexpected "foo"/],
		["error E() view", /Unexpected "view"/],
		["receive() external", /receive must be payable/],
		["fallback(uint256 x) external", /no name or parameters/],
		["modifier onlyOwner()", /Unknown signature kind "modifier"/],
		["function f(tuple x)", /tuple requires components/],
		["function f(uint256,)", /Empty parameter/],
	])("rejects %s", (signature, message) => {
		expect(() => parseHumanReadable([signature])).toThrow(AbiParseError);
		expect(() => parseHumanReadable([signature])).toThrow(message);
	});

	it("rejects circular, duplicate, and empty structs", () => {
		expect(() =>
			parseHumanReadable(["struct A { B b; }", "struct B { A a; }"]),
		).toThrow(/Circular struct reference/);
		expect(() =>
			parseHumanReadable(["struct A { uint a; }", "struct A { uint b; }"]),
		).toThrow(/Duplicate struct "A"/);
		expect(() => parseHumanReadable(["struct A { }"])).toThrow(/no fields/);
		expect(() => parseHumanReadable(["struct A { uint256; }"])).toThrow(
			/needs a name/,
		);
	});

	it("rejects non-string, non-item entries", () => {
		expect(() => parseHumanReadable([42 as never])).toThrow(AbiParseError);
	});
});

describe("Abi.from with human-readable signatures", () => {
	it("builds an Abi whose items encode and look up like JSON ABIs", () => {
		const abi = Abi.from(ERC20);
		expect(abi.getFunction("transfer")).toBeDefined();
		expect(abi.getEvent("Transfer")).toBeDefined();
		expect(abi.getError("InsufficientBalance")).toBeDefined();
		const transfer = abi.getFunction("transfer");
		if (!transfer) throw new Error("missing transfer");
		// keccak256("transfer(address,uint256)")[0:4]
		expect(Array.from(getFunctionSelector(transfer))).toEqual([
			0xa9, 0x05, 0x9c, 0xbb,
		]);
		expect(abi.format()).toEqual([
			"function transfer(address to, uint256 amount) returns (bool)",
			"event Transfer(address from, address to, uint256 value)",
			"error InsufficientBalance(uint256 available, uint256 required)",
		]);
	});

	it("Abi() and Abi.from() agree", () => {
		expect([...Abi(ERC20)]).toEqual([...Abi.from(ERC20)]);
		expect(Abi.parseHumanReadable).toBe(parseHumanReadable);
	});

	it("keeps JSON ABI arrays unchanged", () => {
		const json = parseAbi(ERC20);
		const abi = Abi.from(json);
		expect([...abi]).toEqual(json);
		expect(abi[0]).toBe(json[0]);
	});
});

describe("parseHumanReadable: address payable arrays and zero-length arrays", () => {
	it("normalizes address payable with array suffixes", () => {
		const [fn] = parseHumanReadable([
			"function f(address payable a, address payable[] b, address payable[2] c, address payable[][3] memory d)",
		]) as unknown as [{ inputs: { type: string; name?: string }[] }];
		expect(fn.inputs).toEqual([
			{ type: "address", name: "a" },
			{ type: "address[]", name: "b" },
			{ type: "address[2]", name: "c" },
			{ type: "address[][3]", name: "d" },
		]);
	});

	it("normalizes unnamed address payable[]", () => {
		const [fn] = parseHumanReadable([
			"function f(address payable[])",
		]) as unknown as [{ inputs: { type: string }[] }];
		expect(fn.inputs).toEqual([{ type: "address[]" }]);
	});

	it.each([
		"function f(uint256[0] x)",
		"function f(uint256[2][0] x)",
		"function f(address payable[0] x)",
		"function f((uint256 a)[0] x)",
		"function f(uint256[01] x)",
	])("rejects zero-length or non-canonical fixed array %s", (sig) => {
		expect(() => parseHumanReadable([sig])).toThrow(AbiParseError);
	});

	it("rejects payable on non-address and repeated payable", () => {
		expect(() => parseHumanReadable(["function f(uint256 payable x)"])).toThrow(
			AbiParseError,
		);
		expect(() =>
			parseHumanReadable(["function f(address payable payable x)"]),
		).toThrow(AbiParseError);
	});
});
