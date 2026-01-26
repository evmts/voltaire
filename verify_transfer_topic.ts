import { Keccak256Hash } from '@tevm/voltaire/Keccak256';
import * as Hex from '@tevm/voltaire/Hex';

// Compute Transfer event topic
const signature = 'Transfer(address,address,uint256)';
const topic = Keccak256Hash.fromTopic(signature);
const hexTopic = Hex.fromBytes(topic);

console.log('ANSWER:', hexTopic);
