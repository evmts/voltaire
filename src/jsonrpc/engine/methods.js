/**
 * Engine JSON-RPC Methods
 *
 * This module provides a type-safe mapping of engine namespace methods to their types.
 * All imports are kept separate to maintain tree-shakability.
 */

// Method imports - each import is separate for tree-shaking
import * as engine_exchangeCapabilities from "./exchangeCapabilities/engine_exchangeCapabilities.js";
import * as engine_exchangeTransitionConfigurationV1 from "./exchangeTransitionConfigurationV1/engine_exchangeTransitionConfigurationV1.js";
import * as engine_forkchoiceUpdatedV1 from "./forkchoiceUpdatedV1/engine_forkchoiceUpdatedV1.js";
import * as engine_forkchoiceUpdatedV2 from "./forkchoiceUpdatedV2/engine_forkchoiceUpdatedV2.js";
import * as engine_forkchoiceUpdatedV3 from "./forkchoiceUpdatedV3/engine_forkchoiceUpdatedV3.js";
import * as engine_getBlobsV1 from "./getBlobsV1/engine_getBlobsV1.js";
import * as engine_getBlobsV2 from "./getBlobsV2/engine_getBlobsV2.js";
import * as engine_getPayloadBodiesByHashV1 from "./getPayloadBodiesByHashV1/engine_getPayloadBodiesByHashV1.js";
import * as engine_getPayloadBodiesByRangeV1 from "./getPayloadBodiesByRangeV1/engine_getPayloadBodiesByRangeV1.js";
import * as engine_getPayloadV1 from "./getPayloadV1/engine_getPayloadV1.js";
import * as engine_getPayloadV2 from "./getPayloadV2/engine_getPayloadV2.js";
import * as engine_getPayloadV3 from "./getPayloadV3/engine_getPayloadV3.js";
import * as engine_getPayloadV4 from "./getPayloadV4/engine_getPayloadV4.js";
import * as engine_getPayloadV5 from "./getPayloadV5/engine_getPayloadV5.js";
import * as engine_getPayloadV6 from "./getPayloadV6/engine_getPayloadV6.js";
import * as engine_newPayloadV1 from "./newPayloadV1/engine_newPayloadV1.js";
import * as engine_newPayloadV2 from "./newPayloadV2/engine_newPayloadV2.js";
import * as engine_newPayloadV3 from "./newPayloadV3/engine_newPayloadV3.js";
import * as engine_newPayloadV4 from "./newPayloadV4/engine_newPayloadV4.js";
import * as engine_newPayloadV5 from "./newPayloadV5/engine_newPayloadV5.js";

/**
 * Method name enum - provides string literals for each method
 *
 * @typedef {(typeof EngineMethod)[keyof typeof EngineMethod]} EngineMethod
 */
export const EngineMethod = {
	engine_exchangeCapabilities: "engine_exchangeCapabilities",
	engine_exchangeTransitionConfigurationV1:
		"engine_exchangeTransitionConfigurationV1",
	engine_forkchoiceUpdatedV1: "engine_forkchoiceUpdatedV1",
	engine_forkchoiceUpdatedV2: "engine_forkchoiceUpdatedV2",
	engine_forkchoiceUpdatedV3: "engine_forkchoiceUpdatedV3",
	engine_getBlobsV1: "engine_getBlobsV1",
	engine_getBlobsV2: "engine_getBlobsV2",
	engine_getPayloadBodiesByHashV1: "engine_getPayloadBodiesByHashV1",
	engine_getPayloadBodiesByRangeV1: "engine_getPayloadBodiesByRangeV1",
	engine_getPayloadV1: "engine_getPayloadV1",
	engine_getPayloadV2: "engine_getPayloadV2",
	engine_getPayloadV3: "engine_getPayloadV3",
	engine_getPayloadV4: "engine_getPayloadV4",
	engine_getPayloadV5: "engine_getPayloadV5",
	engine_getPayloadV6: "engine_getPayloadV6",
	engine_newPayloadV1: "engine_newPayloadV1",
	engine_newPayloadV2: "engine_newPayloadV2",
	engine_newPayloadV3: "engine_newPayloadV3",
	engine_newPayloadV4: "engine_newPayloadV4",
	engine_newPayloadV5: "engine_newPayloadV5",
};

// Re-export individual method modules for direct access (tree-shakable)
export {
	engine_exchangeCapabilities,
	engine_exchangeTransitionConfigurationV1,
	engine_forkchoiceUpdatedV1,
	engine_forkchoiceUpdatedV2,
	engine_forkchoiceUpdatedV3,
	engine_getBlobsV1,
	engine_getBlobsV2,
	engine_getPayloadBodiesByHashV1,
	engine_getPayloadBodiesByRangeV1,
	engine_getPayloadV1,
	engine_getPayloadV2,
	engine_getPayloadV3,
	engine_getPayloadV4,
	engine_getPayloadV5,
	engine_getPayloadV6,
	engine_newPayloadV1,
	engine_newPayloadV2,
	engine_newPayloadV3,
	engine_newPayloadV4,
	engine_newPayloadV5,
};
