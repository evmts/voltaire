/**
 * @typedef {import('./BlockStreamType.js').LightBlock} LightBlock
 */

/**
 * Extract light block info from full block
 * @param {*} block
 * @returns {LightBlock}
 */
export function toLightBlock(block) {
	return {
		number:
			typeof block.header?.number === "bigint"
				? block.header.number
				: BigInt(block.header?.number ?? block.number),
		hash: block.hash,
		parentHash: block.header?.parentHash ?? block.parentHash,
		timestamp:
			typeof block.header?.timestamp === "bigint"
				? block.header.timestamp
				: BigInt(block.header?.timestamp ?? block.timestamp),
	};
}
