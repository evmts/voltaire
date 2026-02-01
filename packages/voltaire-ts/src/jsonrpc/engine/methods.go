package engine

// Package engine provides Engine JSON-RPC methods.
//
// This file provides a type-safe mapping of engine namespace methods.

// Method name constants
const (
	MethodEngineExchangeCapabilities = "engine_exchangeCapabilities"
	MethodEngineExchangeTransitionConfigurationV1 = "engine_exchangeTransitionConfigurationV1"
	MethodEngineForkchoiceUpdatedV1 = "engine_forkchoiceUpdatedV1"
	MethodEngineForkchoiceUpdatedV2 = "engine_forkchoiceUpdatedV2"
	MethodEngineForkchoiceUpdatedV3 = "engine_forkchoiceUpdatedV3"
	MethodEngineGetBlobsV1 = "engine_getBlobsV1"
	MethodEngineGetBlobsV2 = "engine_getBlobsV2"
	MethodEngineGetPayloadBodiesByHashV1 = "engine_getPayloadBodiesByHashV1"
	MethodEngineGetPayloadBodiesByRangeV1 = "engine_getPayloadBodiesByRangeV1"
	MethodEngineGetPayloadV1 = "engine_getPayloadV1"
	MethodEngineGetPayloadV2 = "engine_getPayloadV2"
	MethodEngineGetPayloadV3 = "engine_getPayloadV3"
	MethodEngineGetPayloadV4 = "engine_getPayloadV4"
	MethodEngineGetPayloadV5 = "engine_getPayloadV5"
	MethodEngineGetPayloadV6 = "engine_getPayloadV6"
	MethodEngineNewPayloadV1 = "engine_newPayloadV1"
	MethodEngineNewPayloadV2 = "engine_newPayloadV2"
	MethodEngineNewPayloadV3 = "engine_newPayloadV3"
	MethodEngineNewPayloadV4 = "engine_newPayloadV4"
	MethodEngineNewPayloadV5 = "engine_newPayloadV5"
)

// MethodRegistry maps method names to their string identifiers
var MethodRegistry = map[string]string{
	"engine_exchangeCapabilities": MethodEngineExchangeCapabilities,
	"engine_exchangeTransitionConfigurationV1": MethodEngineExchangeTransitionConfigurationV1,
	"engine_forkchoiceUpdatedV1": MethodEngineForkchoiceUpdatedV1,
	"engine_forkchoiceUpdatedV2": MethodEngineForkchoiceUpdatedV2,
	"engine_forkchoiceUpdatedV3": MethodEngineForkchoiceUpdatedV3,
	"engine_getBlobsV1": MethodEngineGetBlobsV1,
	"engine_getBlobsV2": MethodEngineGetBlobsV2,
	"engine_getPayloadBodiesByHashV1": MethodEngineGetPayloadBodiesByHashV1,
	"engine_getPayloadBodiesByRangeV1": MethodEngineGetPayloadBodiesByRangeV1,
	"engine_getPayloadV1": MethodEngineGetPayloadV1,
	"engine_getPayloadV2": MethodEngineGetPayloadV2,
	"engine_getPayloadV3": MethodEngineGetPayloadV3,
	"engine_getPayloadV4": MethodEngineGetPayloadV4,
	"engine_getPayloadV5": MethodEngineGetPayloadV5,
	"engine_getPayloadV6": MethodEngineGetPayloadV6,
	"engine_newPayloadV1": MethodEngineNewPayloadV1,
	"engine_newPayloadV2": MethodEngineNewPayloadV2,
	"engine_newPayloadV3": MethodEngineNewPayloadV3,
	"engine_newPayloadV4": MethodEngineNewPayloadV4,
	"engine_newPayloadV5": MethodEngineNewPayloadV5,
}
