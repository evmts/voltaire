[**@tevm/primitives**](../README.md)

***

[@tevm/primitives](../globals.md) / FilterTopic

# Type Alias: FilterTopic

> **FilterTopic** = `null` \| [`Bytes32`](Bytes32.md) \| readonly [`Bytes32`](Bytes32.md)[]

Defined in: [ethereum-types/filter.ts:20](https://github.com/evmts/primitives/blob/main/src/ethereum-types/filter.ts#L20)

Filter topics - array of topic sets for flexible filtering

- null matches any topic
- Single value matches that specific topic
- Array of values matches any of those topics (OR logic)
