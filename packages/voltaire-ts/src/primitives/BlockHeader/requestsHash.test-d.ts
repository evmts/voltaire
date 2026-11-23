import { expectTypeOf, test } from "vitest";
import type { HashType } from "../Hash/HashType.js";
import type { BlockHeaderType, RpcBlockHeader } from "./index.js";

test("requestsHash preserves branded and RPC types", () => {
	expectTypeOf<BlockHeaderType["requestsHash"]>().toEqualTypeOf<
		HashType | undefined
	>();
	expectTypeOf<RpcBlockHeader["requestsHash"]>().toEqualTypeOf<
		string | undefined
	>();
});
