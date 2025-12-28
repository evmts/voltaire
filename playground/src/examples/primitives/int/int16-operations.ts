import { Int16 } from "@tevm/voltaire";
const room_temp = Int16.fromNumber(215); // 21.5°C
const freezing = Int16.fromNumber(-100); // -10.0°C
const boiling = Int16.fromNumber(1000); // 100.0°C
const delta = Int16.minus(boiling, freezing);
const sea_level = Int16.fromNumber(0);
const mountain = Int16.fromNumber(2500);
const valley = Int16.fromNumber(-50);
const highest = Int16.maximum(mountain, valley);
const lowest = Int16.minimum(mountain, valley);
const baseline = Int16.fromNumber(1000);
const reading1 = Int16.fromNumber(-50);
const reading2 = Int16.fromNumber(75);
const adjusted1 = Int16.plus(baseline, reading1);
const adjusted2 = Int16.plus(baseline, reading2);
