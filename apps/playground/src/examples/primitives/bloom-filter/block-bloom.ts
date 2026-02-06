import { BloomFilter, Bytes, Bytes32 } from "@tevm/voltaire";
const receipt1 = BloomFilter.create(2048, 3);
const contract1 = Bytes.repeat(0x01, 20);
const event1 = Bytes32.zero().fill(0xaa);
const event2 = Bytes32.zero().fill(0xbb);

BloomFilter.add(receipt1, contract1);
BloomFilter.add(receipt1, event1);
BloomFilter.add(receipt1, event2);
const receipt2 = BloomFilter.create(2048, 3);
const contract2 = Bytes.repeat(0x02, 20);
const event3 = Bytes32.zero().fill(0xcc);
const event4 = Bytes32.zero().fill(0xdd);
const event5 = Bytes32.zero().fill(0xee);

BloomFilter.add(receipt2, contract2);
BloomFilter.add(receipt2, event3);
BloomFilter.add(receipt2, event4);
BloomFilter.add(receipt2, event5);
const receipt3 = BloomFilter.create(2048, 3);
const contract3 = Bytes.repeat(0x03, 20);
const event6 = Bytes32.zero().fill(0xff);

BloomFilter.add(receipt3, contract3);
BloomFilter.add(receipt3, event6);
const blockBloom = BloomFilter.combine(receipt1, receipt2, receipt3);
let denseBlockBloom = BloomFilter.create(2048, 3);

for (let tx = 0; tx < 100; tx++) {
	const receiptBloom = BloomFilter.create(2048, 3);
	for (let log = 0; log < 3; log++) {
		const addr = Bytes.zero(20);
		addr[0] = tx;
		addr[19] = log;
		const topic = Bytes32.zero();
		topic[0] = tx;
		topic[31] = log;
		BloomFilter.add(receiptBloom, addr);
		BloomFilter.add(receiptBloom, topic);
	}
	denseBlockBloom = BloomFilter.merge(denseBlockBloom, receiptBloom);
}
const fpr = BloomFilter.expectedFalsePositiveRate(denseBlockBloom, 600); // 100 tx * 3 logs * 2 items per log
const searchContract = Bytes.repeat(0x05, 20);
