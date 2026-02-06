// @ts-nocheck
import { buildControlFlowGraph } from "./buildControlFlowGraph.js";
/**
 * Compute block reachability using BFS
 * @param {Array<import('./BytecodeType.js').BasicBlock>} blocks
 * @param {boolean} hasCFG
 */
export function computeBlockReachability(blocks, hasCFG) {
    if (blocks.length === 0) {
        return;
    }
    if (!hasCFG) {
        // If CFG wasn't built, we need to build it temporarily
        buildControlFlowGraph(blocks);
    }
    // BFS from entry block
    const queue = [0];
    const visited = new Set([0]);
    blocks[0].isReachable = true;
    while (queue.length > 0) {
        const blockIndex = queue.shift();
        const block = blocks[blockIndex];
        if (!block)
            continue;
        for (const successorIndex of block.successors) {
            if (!visited.has(successorIndex)) {
                visited.add(successorIndex);
                blocks[successorIndex].isReachable = true;
                queue.push(successorIndex);
            }
        }
    }
}
