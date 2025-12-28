import { BloomFilter } from "voltaire";
const log1Bloom = BloomFilter.create(2048, 3);
const contract1 = new Uint8Array(20).fill(0x01);
const transferSig = new Uint8Array(32).fill(0xaa);
const from1 = new Uint8Array(32).fill(0x10);
const to1 = new Uint8Array(32).fill(0x20);

BloomFilter.add(log1Bloom, contract1);
BloomFilter.add(log1Bloom, transferSig);
BloomFilter.add(log1Bloom, from1);
BloomFilter.add(log1Bloom, to1);
const log2Bloom = BloomFilter.create(2048, 3);
const contract2 = new Uint8Array(20).fill(0x01); // Same contract
const approvalSig = new Uint8Array(32).fill(0xbb);
const owner = new Uint8Array(32).fill(0x30);
const spender = new Uint8Array(32).fill(0x40);

BloomFilter.add(log2Bloom, contract2);
BloomFilter.add(log2Bloom, approvalSig);
BloomFilter.add(log2Bloom, owner);
BloomFilter.add(log2Bloom, spender);
const log3Bloom = BloomFilter.create(2048, 3);
const contract3 = new Uint8Array(20).fill(0x02);
const customSig = new Uint8Array(32).fill(0xcc);

BloomFilter.add(log3Bloom, contract3);
BloomFilter.add(log3Bloom, customSig);
let receiptBloom = BloomFilter.merge(log1Bloom, log2Bloom);
receiptBloom = BloomFilter.merge(receiptBloom, log3Bloom);

// Alternative: combine multiple at once
const receiptBloom2 = BloomFilter.combine(log1Bloom, log2Bloom, log3Bloom);
const targetContract = new Uint8Array(20).fill(0x01);

const unknownContract = new Uint8Array(20).fill(0xff);
