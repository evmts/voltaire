import { describe, expect, it } from "vitest";
import * as NodeInfo from "./index.js";

describe("NodeInfo", () => {
	const validNodeInfo = {
		enode:
			"enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@10.3.58.6:30303?discport=30301",
		id: "6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
		ip: "10.3.58.6",
		listenAddr: "10.3.58.6:30303",
		name: "Geth/v1.10.26-stable/linux-amd64/go1.19.5",
		ports: {
			discovery: 30301,
			listener: 30303,
		},
		protocols: {
			eth: {
				network: 1,
				difficulty: "0x1234",
				genesis:
					"0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3",
				head: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
				config: {
					chainId: 1,
					homesteadBlock: 0,
				},
			},
			snap: {
				version: 1,
			},
		},
	};

	describe("from", () => {
		it("creates NodeInfo from valid object", () => {
			const nodeInfo = NodeInfo.from(validNodeInfo);
			expect(nodeInfo.name).toBe("Geth/v1.10.26-stable/linux-amd64/go1.19.5");
			expect(nodeInfo.ip).toBe("10.3.58.6");
			expect(nodeInfo.ports.discovery).toBe(30301);
			expect(nodeInfo.ports.listener).toBe(30303);
		});

		it("parses eth protocol correctly", () => {
			const nodeInfo = NodeInfo.from(validNodeInfo);
			expect(nodeInfo.protocols.eth).toBeDefined();
			expect(nodeInfo.protocols.eth?.network).toBe(1);
			expect(nodeInfo.protocols.eth?.config).toEqual({
				chainId: 1,
				homesteadBlock: 0,
			});
		});

		it("preserves other protocols", () => {
			const nodeInfo = NodeInfo.from(validNodeInfo);
			expect(nodeInfo.protocols.snap).toEqual({ version: 1 });
		});

		it("throws on non-object", () => {
			expect(() => NodeInfo.from("not an object" as any)).toThrow(
				"Node info must be an object",
			);
		});

		it("throws on missing enode", () => {
			const invalid = { ...validNodeInfo };
			delete (invalid as any).enode;
			expect(() => NodeInfo.from(invalid)).toThrow(
				"Node info must have 'enode' string field",
			);
		});

		it("throws on missing id", () => {
			const invalid = { ...validNodeInfo };
			delete (invalid as any).id;
			expect(() => NodeInfo.from(invalid)).toThrow(
				"Node info must have 'id' string field",
			);
		});

		it("throws on missing ports", () => {
			const invalid = { ...validNodeInfo };
			delete (invalid as any).ports;
			expect(() => NodeInfo.from(invalid)).toThrow(
				"Node info must have 'ports' object field",
			);
		});

		it("throws on invalid ports", () => {
			const invalid = {
				...validNodeInfo,
				ports: { discovery: "not a number", listener: 30303 },
			};
			expect(() => NodeInfo.from(invalid)).toThrow(
				"Node info ports must have 'discovery' and 'listener' number fields",
			);
		});

		it("throws on missing protocols", () => {
			const invalid = { ...validNodeInfo };
			delete (invalid as any).protocols;
			expect(() => NodeInfo.from(invalid)).toThrow(
				"Node info must have 'protocols' object field",
			);
		});
	});

	describe("getProtocol", () => {
		it("returns eth protocol when present", () => {
			const nodeInfo = NodeInfo.from(validNodeInfo);
			const ethProtocol = NodeInfo.getProtocol(nodeInfo, "eth");
			expect(ethProtocol).toBeDefined();
			expect((ethProtocol as any).network).toBe(1);
		});

		it("returns other protocols", () => {
			const nodeInfo = NodeInfo.from(validNodeInfo);
			const snapProtocol = NodeInfo.getProtocol(nodeInfo, "snap");
			expect(snapProtocol).toEqual({ version: 1 });
		});

		it("returns undefined for missing protocol", () => {
			const nodeInfo = NodeInfo.from(validNodeInfo);
			const missing = NodeInfo.getProtocol(nodeInfo, "missing");
			expect(missing).toBeUndefined();
		});
	});
});
