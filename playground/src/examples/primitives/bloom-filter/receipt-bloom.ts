import { BloomFilter, Bytes, Bytes32 } from "@tevm/voltaire";
const log1Bloom = BloomFilter.create(2048, 3);
const contract1 = Bytes.repeat(0x01, 20);
const transferSig = Bytes32.zero().fill(0xaa);
const from1 = Bytes32.zero().fill(0x10);
const to1 = Bytes32.zero().fill(0x20);

BloomFilter.add(log1Bloom, contract1);
BloomFilter.add(log1Bloom, transferSig);
BloomFilter.add(log1Bloom, from1);
BloomFilter.add(log1Bloom, to1);
const log2Bloom = BloomFilter.create(2048, 3);
const contract2 = Bytes.repeat(0x01, 20); // Same contract
const approvalSig = Bytes32.zero().fill(0xbb);
const owner = Bytes32.zero().fill(0x30);
const spender = Bytes32.zero().fill(0x40);

BloomFilter.add(log2Bloom, contract2);
BloomFilter.add(log2Bloom, approvalSig);
BloomFilter.add(log2Bloom, owner);
BloomFilter.add(log2Bloom, spender);
const log3Bloom = BloomFilter.create(2048, 3);
const contract3 = Bytes.repeat(0x02, 20);
const customSig = Bytes32.zero().fill(0xcc);

BloomFilter.add(log3Bloom, contract3);
BloomFilter.add(log3Bloom, customSig);
let receiptBloom = BloomFilter.merge(log1Bloom, log2Bloom);
receiptBloom = BloomFilter.merge(receiptBloom, log3Bloom);

// Alternative: combine multiple at once
const receiptBloom2 = BloomFilter.combine(log1Bloom, log2Bloom, log3Bloom);
const targetContract = Bytes.repeat(0x01, 20);

const unknownContract = Bytes.repeat(0xff, 20);
