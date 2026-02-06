// @ts-nocheck
/**
 * Build control flow graph
 * @param {Array<import('./BytecodeType.js').BasicBlock>} blocks
 */
export function buildControlFlowGraph(blocks) {
    // Create PC to block index map
    const pcToBlock = new Map();
    for (const block of blocks) {
        pcToBlock.set(block.startPc, block.index);
    }
    // Build edges
    for (const block of blocks) {
        addBlockEdges(block, blocks, pcToBlock);
    }
}
/**
 * Add CFG edges for a block
 * @param {import('./BytecodeType.js').BasicBlock} block
 * @param {Array<import('./BytecodeType.js').BasicBlock>} blocks
 * @param {Map<number, number>} pcToBlock
 */
function addBlockEdges(block, blocks, pcToBlock) {
    const terminator = block.terminator;
    if (terminator === "jump") {
        addJumpEdge(block, blocks, pcToBlock);
    }
    else if (terminator === "jumpi") {
        addJumpEdge(block, blocks, pcToBlock);
        addFallthroughEdge(block, blocks);
    }
    else if (terminator === "fallthrough") {
        addFallthroughEdge(block, blocks);
    }
}
/**
 * Add jump edge
 * @param {import('./BytecodeType.js').BasicBlock} block
 * @param {Array<import('./BytecodeType.js').BasicBlock>} blocks
 * @param {Map<number, number>} pcToBlock
 */
function addJumpEdge(block, blocks, pcToBlock) {
    if (block.target !== undefined) {
        const targetIndex = pcToBlock.get(block.target);
        if (targetIndex !== undefined) {
            block.successors.push(targetIndex);
            blocks[targetIndex].predecessors.push(block.index);
        }
    }
}
/**
 * Add fallthrough edge
 * @param {import('./BytecodeType.js').BasicBlock} block
 * @param {Array<import('./BytecodeType.js').BasicBlock>} blocks
 */
function addFallthroughEdge(block, blocks) {
    const nextBlock = blocks[block.index + 1];
    if (nextBlock) {
        block.successors.push(nextBlock.index);
        nextBlock.predecessors.push(block.index);
    }
}
