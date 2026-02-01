/**
 * Benchmark: NodeInfo operations
 * Tests node info parsing and protocol lookup
 */

import { bench, run } from "mitata";
import * as NodeInfo from "./index.js";

// Test data - realistic node info
const nodeInfoData = {
	id: "enode://abc123...@127.0.0.1:30303",
	name: "Geth/v1.13.0-stable-abc123/linux-amd64/go1.21",
	enode: "enode://abc123...@127.0.0.1:30303",
	enr: "enr:-...",
	ip: "127.0.0.1",
	ports: {
		discovery: 30303,
		listener: 30303,
	},
	listenAddr: "127.0.0.1:30303",
	protocols: {
		eth: {
			network: 1,
			difficulty: 1000000n,
			genesis: `0x${"ab".repeat(32)}`,
			head: `0x${"cd".repeat(32)}`,
		},
		snap: {
			network: 1,
		},
	},
};

// Pre-created node info
const nodeInfo = NodeInfo.from(nodeInfoData);

// ============================================================================
// from (constructor)
// ============================================================================

bench("NodeInfo.from - voltaire", () => {
	NodeInfo.from(nodeInfoData);
});

await run();

// ============================================================================
// getProtocol
// ============================================================================

bench("NodeInfo.getProtocol - eth - voltaire", () => {
	NodeInfo.getProtocol(nodeInfo, "eth");
});

bench("NodeInfo.getProtocol - snap - voltaire", () => {
	NodeInfo.getProtocol(nodeInfo, "snap");
});

bench("NodeInfo.getProtocol - unknown - voltaire", () => {
	NodeInfo.getProtocol(nodeInfo, "unknown");
});

await run();
