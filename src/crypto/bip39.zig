//! BIP-39 Mnemonic Implementation
//!
//! Implements BIP-39 mnemonic code for generating deterministic keys.
//! This module provides functions for generating, validating, and converting
//! between mnemonics, entropy, and seeds.
//!
//! ## Features
//! - Generate random mnemonics (12/15/18/21/24 words)
//! - Convert mnemonic to 64-byte seed (PBKDF2-SHA512)
//! - Validate mnemonic checksum and words
//! - Convert between entropy and mnemonic
//!
//! ## Usage
//! ```zig
//! const bip39 = @import("bip39");
//!
//! // Generate a 24-word mnemonic
//! var mnemonic_buf: [24][8]u8 = undefined;
//! const mnemonic = bip39.generateMnemonic(256, &mnemonic_buf) catch |err| {
//!     // handle error
//! };
//!
//! // Convert to seed
//! var seed: [64]u8 = undefined;
//! bip39.mnemonicToSeed(mnemonic, "passphrase", &seed);
//!
//! // Validate
//! const is_valid = bip39.validateMnemonic(mnemonic);
//! ```
//!
//! ## References
//! - [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)

const std = @import("std");
const crypto = std.crypto;
const Sha256 = crypto.hash.sha2.Sha256;
const HmacSha512 = crypto.auth.hmac.sha2.HmacSha512;
const pbkdf2 = crypto.pwhash.pbkdf2;

/// BIP-39 English wordlist (2048 words)
pub const wordlist = [_][]const u8{
    "abandon",   "ability",   "able",       "about",     "above",     "absent",    "absorb",    "abstract",
    "absurd",    "abuse",     "access",     "accident",  "account",   "accuse",    "achieve",   "acid",
    "acoustic",  "acquire",   "across",     "act",       "action",    "actor",     "actress",   "actual",
    "adapt",     "add",       "addict",     "address",   "adjust",    "admit",     "adult",     "advance",
    "advice",    "aerobic",   "affair",     "afford",    "afraid",    "again",     "age",       "agent",
    "agree",     "ahead",     "aim",        "air",       "airport",   "aisle",     "alarm",     "album",
    "alcohol",   "alert",     "alien",      "all",       "alley",     "allow",     "almost",    "alone",
    "alpha",     "already",   "also",       "alter",     "always",    "amateur",   "amazing",   "among",
    "amount",    "amused",    "analyst",    "anchor",    "ancient",   "anger",     "angle",     "angry",
    "animal",    "ankle",     "announce",   "annual",    "another",   "answer",    "antenna",   "antique",
    "anxiety",   "any",       "apart",      "apology",   "appear",    "apple",     "approve",   "april",
    "arch",      "arctic",    "area",       "arena",     "argue",     "arm",       "armed",     "armor",
    "army",      "around",    "arrange",    "arrest",    "arrive",    "arrow",     "art",       "artefact",
    "artist",    "artwork",   "ask",        "aspect",    "assault",   "asset",     "assist",    "assume",
    "asthma",    "athlete",   "atom",       "attack",    "attend",    "attitude",  "attract",   "auction",
    "audit",     "august",    "aunt",       "author",    "auto",      "autumn",    "average",   "avocado",
    "avoid",     "awake",     "aware",      "away",      "awesome",   "awful",     "awkward",   "axis",
    "baby",      "bachelor",  "bacon",      "badge",     "bag",       "balance",   "balcony",   "ball",
    "bamboo",    "banana",    "banner",     "bar",       "barely",    "bargain",   "barrel",    "base",
    "basic",     "basket",    "battle",     "beach",     "bean",      "beauty",    "because",   "become",
    "beef",      "before",    "begin",      "behave",    "behind",    "believe",   "below",     "belt",
    "bench",     "benefit",   "best",       "betray",    "better",    "between",   "beyond",    "bicycle",
    "bid",       "bike",      "bind",       "biology",   "bird",      "birth",     "bitter",    "black",
    "blade",     "blame",     "blanket",    "blast",     "bleak",     "bless",     "blind",     "blood",
    "blossom",   "blouse",    "blue",       "blur",      "blush",     "board",     "boat",      "body",
    "boil",      "bomb",      "bone",       "bonus",     "book",      "boost",     "border",    "boring",
    "borrow",    "boss",      "bottom",     "bounce",    "box",       "boy",       "bracket",   "brain",
    "brand",     "brass",     "brave",      "bread",     "breeze",    "brick",     "bridge",    "brief",
    "bright",    "bring",     "brisk",      "broccoli",  "broken",    "bronze",    "broom",     "brother",
    "brown",     "brush",     "bubble",     "buddy",     "budget",    "buffalo",   "build",     "bulb",
    "bulk",      "bullet",    "bundle",     "bunker",    "burden",    "burger",    "burst",     "bus",
    "business",  "busy",      "butter",     "buyer",     "buzz",      "cabbage",   "cabin",     "cable",
    "cactus",    "cage",      "cake",       "call",      "calm",      "camera",    "camp",      "can",
    "canal",     "cancel",    "candy",      "cannon",    "canoe",     "canvas",    "canyon",    "capable",
    "capital",   "captain",   "car",        "carbon",    "card",      "cargo",     "carpet",    "carry",
    "cart",      "case",      "cash",       "casino",    "castle",    "casual",    "cat",       "catalog",
    "catch",     "category",  "cattle",     "caught",    "cause",     "caution",   "cave",      "ceiling",
    "celery",    "cement",    "census",     "century",   "cereal",    "certain",   "chair",     "chalk",
    "champion",  "change",    "chaos",      "chapter",   "charge",    "chase",     "chat",      "cheap",
    "check",     "cheese",    "chef",       "cherry",    "chest",     "chicken",   "chief",     "child",
    "chimney",   "choice",    "choose",     "chronic",   "chuckle",   "chunk",     "churn",     "cigar",
    "cinnamon",  "circle",    "citizen",    "city",      "civil",     "claim",     "clap",      "clarify",
    "claw",      "clay",      "clean",      "clerk",     "clever",    "click",     "client",    "cliff",
    "climb",     "clinic",    "clip",       "clock",     "clog",      "close",     "cloth",     "cloud",
    "clown",     "club",      "clump",      "cluster",   "clutch",    "coach",     "coast",     "coconut",
    "code",      "coffee",    "coil",       "coin",      "collect",   "color",     "column",    "combine",
    "come",      "comfort",   "comic",      "common",    "company",   "concert",   "conduct",   "confirm",
    "congress",  "connect",   "consider",   "control",   "convince",  "cook",      "cool",      "copper",
    "copy",      "coral",     "core",       "corn",      "correct",   "cost",      "cotton",    "couch",
    "country",   "couple",    "course",     "cousin",    "cover",     "coyote",    "crack",     "cradle",
    "craft",     "cram",      "crane",      "crash",     "crater",    "crawl",     "crazy",     "cream",
    "credit",    "creek",     "crew",       "cricket",   "crime",     "crisp",     "critic",    "crop",
    "cross",     "crouch",    "crowd",      "crucial",   "cruel",     "cruise",    "crumble",   "crunch",
    "crush",     "cry",       "crystal",    "cube",      "culture",   "cup",       "cupboard",  "curious",
    "current",   "curtain",   "curve",      "cushion",   "custom",    "cute",      "cycle",     "dad",
    "damage",    "damp",      "dance",      "danger",    "daring",    "dash",      "daughter",  "dawn",
    "day",       "deal",      "debate",     "debris",    "decade",    "december",  "decide",    "decline",
    "decorate",  "decrease",  "deer",       "defense",   "define",    "defy",      "degree",    "delay",
    "deliver",   "demand",    "demise",     "denial",    "dentist",   "deny",      "depart",    "depend",
    "deposit",   "depth",     "deputy",     "derive",    "describe",  "desert",    "design",    "desk",
    "despair",   "destroy",   "detail",     "detect",    "develop",   "device",    "devote",    "diagram",
    "dial",      "diamond",   "diary",      "dice",      "diesel",    "diet",      "differ",    "digital",
    "dignity",   "dilemma",   "dinner",     "dinosaur",  "direct",    "dirt",      "disagree",  "discover",
    "disease",   "dish",      "dismiss",    "disorder",  "display",   "distance",  "divert",    "divide",
    "divorce",   "dizzy",     "doctor",     "document",  "dog",       "doll",      "dolphin",   "domain",
    "donate",    "donkey",    "donor",      "door",      "dose",      "double",    "dove",      "draft",
    "dragon",    "drama",     "drastic",    "draw",      "dream",     "dress",     "drift",     "drill",
    "drink",     "drip",      "drive",      "drop",      "drum",      "dry",       "duck",      "dumb",
    "dune",      "during",    "dust",       "dutch",     "duty",      "dwarf",     "dynamic",   "eager",
    "eagle",     "early",     "earn",       "earth",     "easily",    "east",      "easy",      "echo",
    "ecology",   "economy",   "edge",       "edit",      "educate",   "effort",    "egg",       "eight",
    "either",    "elbow",     "elder",      "electric",  "elegant",   "element",   "elephant",  "elevator",
    "elite",     "else",      "embark",     "embody",    "embrace",   "emerge",    "emotion",   "employ",
    "empower",   "empty",     "enable",     "enact",     "end",       "endless",   "endorse",   "enemy",
    "energy",    "enforce",   "engage",     "engine",    "enhance",   "enjoy",     "enlist",    "enough",
    "enrich",    "enroll",    "ensure",     "enter",     "entire",    "entry",     "envelope",  "episode",
    "equal",     "equip",     "era",        "erase",     "erode",     "erosion",   "error",     "erupt",
    "escape",    "essay",     "essence",    "estate",    "eternal",   "ethics",    "evidence",  "evil",
    "evoke",     "evolve",    "exact",      "example",   "excess",    "exchange",  "excite",    "exclude",
    "excuse",    "execute",   "exercise",   "exhaust",   "exhibit",   "exile",     "exist",     "exit",
    "exotic",    "expand",    "expect",     "expire",    "explain",   "expose",    "express",   "extend",
    "extra",     "eye",       "eyebrow",    "fabric",    "face",      "faculty",   "fade",      "faint",
    "faith",     "fall",      "false",      "fame",      "family",    "famous",    "fan",       "fancy",
    "fantasy",   "farm",      "fashion",    "fat",       "fatal",     "father",    "fatigue",   "fault",
    "favorite",  "feature",   "february",   "federal",   "fee",       "feed",      "feel",      "female",
    "fence",     "festival",  "fetch",      "fever",     "few",       "fiber",     "fiction",   "field",
    "figure",    "file",      "film",       "filter",    "final",     "find",      "fine",      "finger",
    "finish",    "fire",      "firm",       "first",     "fiscal",    "fish",      "fit",       "fitness",
    "fix",       "flag",      "flame",      "flash",     "flat",      "flavor",    "flee",      "flight",
    "flip",      "float",     "flock",      "floor",     "flower",    "fluid",     "flush",     "fly",
    "foam",      "focus",     "fog",        "foil",      "fold",      "follow",    "food",      "foot",
    "force",     "forest",    "forget",     "fork",      "fortune",   "forum",     "forward",   "fossil",
    "foster",    "found",     "fox",        "fragile",   "frame",     "frequent",  "fresh",     "friend",
    "fringe",    "frog",      "front",      "frost",     "frown",     "frozen",    "fruit",     "fuel",
    "fun",       "funny",     "furnace",    "fury",      "future",    "gadget",    "gain",      "galaxy",
    "gallery",   "game",      "gap",        "garage",    "garbage",   "garden",    "garlic",    "garment",
    "gas",       "gasp",      "gate",       "gather",    "gauge",     "gaze",      "general",   "genius",
    "genre",     "gentle",    "genuine",    "gesture",   "ghost",     "giant",     "gift",      "giggle",
    "ginger",    "giraffe",   "girl",       "give",      "glad",      "glance",    "glare",     "glass",
    "glide",     "glimpse",   "globe",      "gloom",     "glory",     "glove",     "glow",      "glue",
    "goat",      "goddess",   "gold",       "good",      "goose",     "gorilla",   "gospel",    "gossip",
    "govern",    "gown",      "grab",       "grace",     "grain",     "grant",     "grape",     "grass",
    "gravity",   "great",     "green",      "grid",      "grief",     "grit",      "grocery",   "group",
    "grow",      "grunt",     "guard",      "guess",     "guide",     "guilt",     "guitar",    "gun",
    "gym",       "habit",     "hair",       "half",      "hammer",    "hamster",   "hand",      "happy",
    "harbor",    "hard",      "harsh",      "harvest",   "hat",       "have",      "hawk",      "hazard",
    "head",      "health",    "heart",      "heavy",     "hedgehog",  "height",    "hello",     "helmet",
    "help",      "hen",       "hero",       "hidden",    "high",      "hill",      "hint",      "hip",
    "hire",      "history",   "hobby",      "hockey",    "hold",      "hole",      "holiday",   "hollow",
    "home",      "honey",     "hood",       "hope",      "horn",      "horror",    "horse",     "hospital",
    "host",      "hotel",     "hour",       "hover",     "hub",       "huge",      "human",     "humble",
    "humor",     "hundred",   "hungry",     "hunt",      "hurdle",    "hurry",     "hurt",      "husband",
    "hybrid",    "ice",       "icon",       "idea",      "identify",  "idle",      "ignore",    "ill",
    "illegal",   "illness",   "image",      "imitate",   "immense",   "immune",    "impact",    "impose",
    "improve",   "impulse",   "inch",       "include",   "income",    "increase",  "index",     "indicate",
    "indoor",    "industry",  "infant",     "inflict",   "inform",    "inhale",    "inherit",   "initial",
    "inject",    "injury",    "inmate",     "inner",     "innocent",  "input",     "inquiry",   "insane",
    "insect",    "inside",    "inspire",    "install",   "intact",    "interest",  "into",      "invest",
    "invite",    "involve",   "iron",       "island",    "isolate",   "issue",     "item",      "ivory",
    "jacket",    "jaguar",    "jar",        "jazz",      "jealous",   "jeans",     "jelly",     "jewel",
    "job",       "join",      "joke",       "journey",   "joy",       "judge",     "juice",     "jump",
    "jungle",    "junior",    "junk",       "just",      "kangaroo",  "keen",      "keep",      "ketchup",
    "key",       "kick",      "kid",        "kidney",    "kind",      "kingdom",   "kiss",      "kit",
    "kitchen",   "kite",      "kitten",     "kiwi",      "knee",      "knife",     "knock",     "know",
    "lab",       "label",     "labor",      "ladder",    "lady",      "lake",      "lamp",      "language",
    "laptop",    "large",     "later",      "latin",     "laugh",     "laundry",   "lava",      "law",
    "lawn",      "lawsuit",   "layer",      "lazy",      "leader",    "leaf",      "learn",     "leave",
    "lecture",   "left",      "leg",        "legal",     "legend",    "leisure",   "lemon",     "lend",
    "length",    "lens",      "leopard",    "lesson",    "letter",    "level",     "liar",      "liberty",
    "library",   "license",   "life",       "lift",      "light",     "like",      "limb",      "limit",
    "link",      "lion",      "liquid",     "list",      "little",    "live",      "lizard",    "load",
    "loan",      "lobster",   "local",      "lock",      "logic",     "lonely",    "long",      "loop",
    "lottery",   "loud",      "lounge",     "love",      "loyal",     "lucky",     "luggage",   "lumber",
    "lunar",     "lunch",     "luxury",     "lyrics",    "machine",   "mad",       "magic",     "magnet",
    "maid",      "mail",      "main",       "major",     "make",      "mammal",    "man",       "manage",
    "mandate",   "mango",     "mansion",    "manual",    "maple",     "marble",    "march",     "margin",
    "marine",    "market",    "marriage",   "mask",      "mass",      "master",    "match",     "material",
    "math",      "matrix",    "matter",     "maximum",   "maze",      "meadow",    "mean",      "measure",
    "meat",      "mechanic",  "medal",      "media",     "melody",    "melt",      "member",    "memory",
    "mention",   "menu",      "mercy",      "merge",     "merit",     "merry",     "mesh",      "message",
    "metal",     "method",    "middle",     "midnight",  "milk",      "million",   "mimic",     "mind",
    "minimum",   "minor",     "minute",     "miracle",   "mirror",    "misery",    "miss",      "mistake",
    "mix",       "mixed",     "mixture",    "mobile",    "model",     "modify",    "mom",       "moment",
    "monitor",   "monkey",    "monster",    "month",     "moon",      "moral",     "more",      "morning",
    "mosquito",  "mother",    "motion",     "motor",     "mountain",  "mouse",     "move",      "movie",
    "much",      "muffin",    "mule",       "multiply",  "muscle",    "museum",    "mushroom",  "music",
    "must",      "mutual",    "myself",     "mystery",   "myth",      "naive",     "name",      "napkin",
    "narrow",    "nasty",     "nation",     "nature",    "near",      "neck",      "need",      "negative",
    "neglect",   "neither",   "nephew",     "nerve",     "nest",      "net",       "network",   "neutral",
    "never",     "news",      "next",       "nice",      "night",     "noble",     "noise",     "nominee",
    "noodle",    "normal",    "north",      "nose",      "notable",   "note",      "nothing",   "notice",
    "novel",     "now",       "nuclear",    "number",    "nurse",     "nut",       "oak",       "obey",
    "object",    "oblige",    "obscure",    "observe",   "obtain",    "obvious",   "occur",     "ocean",
    "october",   "odor",      "off",        "offer",     "office",    "often",     "oil",       "okay",
    "old",       "olive",     "olympic",    "omit",      "once",      "one",       "onion",     "online",
    "only",      "open",      "opera",      "opinion",   "oppose",    "option",    "orange",    "orbit",
    "orchard",   "order",     "ordinary",   "organ",     "orient",    "original",  "orphan",    "ostrich",
    "other",     "outdoor",   "outer",      "output",    "outside",   "oval",      "oven",      "over",
    "own",       "owner",     "oxygen",     "oyster",    "ozone",     "pact",      "paddle",    "page",
    "pair",      "palace",    "palm",       "panda",     "panel",     "panic",     "panther",   "paper",
    "parade",    "parent",    "park",       "parrot",    "party",     "pass",      "patch",     "path",
    "patient",   "patrol",    "pattern",    "pause",     "pave",      "payment",   "peace",     "peanut",
    "pear",      "peasant",   "pelican",    "pen",       "penalty",   "pencil",    "people",    "pepper",
    "perfect",   "permit",    "person",     "pet",       "phone",     "photo",     "phrase",    "physical",
    "piano",     "picnic",    "picture",    "piece",     "pig",       "pigeon",    "pill",      "pilot",
    "pink",      "pioneer",   "pipe",       "pistol",    "pitch",     "pizza",     "place",     "planet",
    "plastic",   "plate",     "play",       "please",    "pledge",    "pluck",     "plug",      "plunge",
    "poem",      "poet",      "point",      "polar",     "pole",      "police",    "pond",      "pony",
    "pool",      "popular",   "portion",    "position",  "possible",  "post",      "potato",    "pottery",
    "poverty",   "powder",    "power",      "practice",  "praise",    "predict",   "prefer",    "prepare",
    "present",   "pretty",    "prevent",    "price",     "pride",     "primary",   "print",     "priority",
    "prison",    "private",   "prize",      "problem",   "process",   "produce",   "profit",    "program",
    "project",   "promote",   "proof",      "property",  "prosper",   "protect",   "proud",     "provide",
    "public",    "pudding",   "pull",       "pulp",      "pulse",     "pumpkin",   "punch",     "pupil",
    "puppy",     "purchase",  "purity",     "purpose",   "purse",     "push",      "put",       "puzzle",
    "pyramid",   "quality",   "quantum",    "quarter",   "question",  "quick",     "quit",      "quiz",
    "quote",     "rabbit",    "raccoon",    "race",      "rack",      "radar",     "radio",     "rail",
    "rain",      "raise",     "rally",      "ramp",      "ranch",     "random",    "range",     "rapid",
    "rare",      "rate",      "rather",     "raven",     "raw",       "razor",     "ready",     "real",
    "reason",    "rebel",     "rebuild",    "recall",    "receive",   "recipe",    "record",    "recycle",
    "reduce",    "reflect",   "reform",     "refuse",    "region",    "regret",    "regular",   "reject",
    "relax",     "release",   "relief",     "rely",      "remain",    "remember",  "remind",    "remove",
    "render",    "renew",     "rent",       "reopen",    "repair",    "repeat",    "replace",   "report",
    "require",   "rescue",    "resemble",   "resist",    "resource",  "response",  "result",    "retire",
    "retreat",   "return",    "reunion",    "reveal",    "review",    "reward",    "rhythm",    "rib",
    "ribbon",    "rice",      "rich",       "ride",      "ridge",     "rifle",     "right",     "rigid",
    "ring",      "riot",      "ripple",     "risk",      "ritual",    "rival",     "river",     "road",
    "roast",     "robot",     "robust",     "rocket",    "romance",   "roof",      "rookie",    "room",
    "rose",      "rotate",    "rough",      "round",     "route",     "royal",     "rubber",    "rude",
    "rug",       "rule",      "run",        "runway",    "rural",     "sad",       "saddle",    "sadness",
    "safe",      "sail",      "salad",      "salmon",    "salon",     "salt",      "salute",    "same",
    "sample",    "sand",      "satisfy",    "satoshi",   "sauce",     "sausage",   "save",      "say",
    "scale",     "scan",      "scare",      "scatter",   "scene",     "scheme",    "school",    "science",
    "scissors",  "scorpion",  "scout",      "scrap",     "screen",    "script",    "scrub",     "sea",
    "search",    "season",    "seat",       "second",    "secret",    "section",   "security",  "seed",
    "seek",      "segment",   "select",     "sell",      "seminar",   "senior",    "sense",     "sentence",
    "series",    "service",   "session",    "settle",    "setup",     "seven",     "shadow",    "shaft",
    "shallow",   "share",     "shed",       "shell",     "sheriff",   "shield",    "shift",     "shine",
    "ship",      "shiver",    "shock",      "shoe",      "shoot",     "shop",      "short",     "shoulder",
    "shove",     "shrimp",    "shrug",      "shuffle",   "shy",       "sibling",   "sick",      "side",
    "siege",     "sight",     "sign",       "silent",    "silk",      "silly",     "silver",    "similar",
    "simple",    "since",     "sing",       "siren",     "sister",    "situate",   "six",       "size",
    "skate",     "sketch",    "ski",        "skill",     "skin",      "skirt",     "skull",     "slab",
    "slam",      "sleep",     "slender",    "slice",     "slide",     "slight",    "slim",      "slogan",
    "slot",      "slow",      "slush",      "small",     "smart",     "smile",     "smoke",     "smooth",
    "snack",     "snake",     "snap",       "sniff",     "snow",      "soap",      "soccer",    "social",
    "sock",      "soda",      "soft",       "solar",     "soldier",   "solid",     "solution",  "solve",
    "someone",   "song",      "soon",       "sorry",     "sort",      "soul",      "sound",     "soup",
    "source",    "south",     "space",      "spare",     "spatial",   "spawn",     "speak",     "special",
    "speed",     "spell",     "spend",      "sphere",    "spice",     "spider",    "spike",     "spin",
    "spirit",    "split",     "spoil",      "sponsor",   "spoon",     "sport",     "spot",      "spray",
    "spread",    "spring",    "spy",        "square",    "squeeze",   "squirrel",  "stable",    "stadium",
    "staff",     "stage",     "stairs",     "stamp",     "stand",     "start",     "state",     "stay",
    "steak",     "steel",     "stem",       "step",      "stereo",    "stick",     "still",     "sting",
    "stock",     "stomach",   "stone",      "stool",     "story",     "stove",     "strategy",  "street",
    "strike",    "strong",    "struggle",   "student",   "stuff",     "stumble",   "style",     "subject",
    "submit",    "subway",    "success",    "such",      "sudden",    "suffer",    "sugar",     "suggest",
    "suit",      "summer",    "sun",        "sunny",     "sunset",    "super",     "supply",    "supreme",
    "sure",      "surface",   "surge",      "surprise",  "surround",  "survey",    "suspect",   "sustain",
    "swallow",   "swamp",     "swap",       "swarm",     "swear",     "sweet",     "swift",     "swim",
    "swing",     "switch",    "sword",      "symbol",    "symptom",   "syrup",     "system",    "table",
    "tackle",    "tag",       "tail",       "talent",    "talk",      "tank",      "tape",      "target",
    "task",      "taste",     "tattoo",     "taxi",      "teach",     "team",      "tell",      "ten",
    "tenant",    "tennis",    "tent",       "term",      "test",      "text",      "thank",     "that",
    "theme",     "then",      "theory",     "there",     "they",      "thing",     "this",      "thought",
    "three",     "thrive",    "throw",      "thumb",     "thunder",   "ticket",    "tide",      "tiger",
    "tilt",      "timber",    "time",       "tiny",      "tip",       "tired",     "tissue",    "title",
    "toast",     "tobacco",   "today",      "toddler",   "toe",       "together",  "toilet",    "token",
    "tomato",    "tomorrow",  "tone",       "tongue",    "tonight",   "tool",      "tooth",     "top",
    "topic",     "topple",    "torch",      "tornado",   "tortoise",  "toss",      "total",     "tourist",
    "toward",    "tower",     "town",       "toy",       "track",     "trade",     "traffic",   "tragic",
    "train",     "transfer",  "trap",       "trash",     "travel",    "tray",      "treat",     "tree",
    "trend",     "trial",     "tribe",      "trick",     "trigger",   "trim",      "trip",      "trophy",
    "trouble",   "truck",     "true",       "truly",     "trumpet",   "trust",     "truth",     "try",
    "tube",      "tuition",   "tumble",     "tuna",      "tunnel",    "turkey",    "turn",      "turtle",
    "twelve",    "twenty",    "twice",      "twin",      "twist",     "two",       "type",      "typical",
    "ugly",      "umbrella",  "unable",     "unaware",   "uncle",     "uncover",   "under",     "undo",
    "unfair",    "unfold",    "unhappy",    "uniform",   "unique",    "unit",      "universe",  "unknown",
    "unlock",    "until",     "unusual",    "unveil",    "update",    "upgrade",   "uphold",    "upon",
    "upper",     "upset",     "urban",      "urge",      "usage",     "use",       "used",      "useful",
    "useless",   "usual",     "utility",    "vacant",    "vacuum",    "vague",     "valid",     "valley",
    "valve",     "van",       "vanish",     "vapor",     "various",   "vast",      "vault",     "vehicle",
    "velvet",    "vendor",    "venture",    "venue",     "verb",      "verify",    "version",   "very",
    "vessel",    "veteran",   "viable",     "vibrant",   "vicious",   "victory",   "video",     "view",
    "village",   "vintage",   "violin",     "virtual",   "virus",     "visa",      "visit",     "visual",
    "vital",     "vivid",     "vocal",      "voice",     "void",      "volcano",   "volume",    "vote",
    "voyage",    "wage",      "wagon",      "wait",      "walk",      "wall",      "walnut",    "want",
    "warfare",   "warm",      "warrior",    "wash",      "wasp",      "waste",     "water",     "wave",
    "way",       "wealth",    "weapon",     "wear",      "weasel",    "weather",   "web",       "wedding",
    "weekend",   "weird",     "welcome",    "west",      "wet",       "whale",     "what",      "wheat",
    "wheel",     "when",      "where",      "whip",      "whisper",   "wide",      "width",     "wife",
    "wild",      "will",      "win",        "window",    "wine",      "wing",      "wink",      "winner",
    "winter",    "wire",      "wisdom",     "wise",      "wish",      "witness",   "wolf",      "woman",
    "wonder",    "wood",      "wool",       "word",      "work",      "world",     "worry",     "worth",
    "wrap",      "wreck",     "wrestle",    "wrist",     "write",     "wrong",     "yard",      "year",
    "yellow",    "you",       "young",      "youth",     "zebra",     "zero",      "zone",      "zoo",
};

/// Entropy size constants
pub const ENTROPY_128 = 128;
pub const ENTROPY_160 = 160;
pub const ENTROPY_192 = 192;
pub const ENTROPY_224 = 224;
pub const ENTROPY_256 = 256;

/// Seed length (64 bytes)
pub const SEED_LENGTH = 64;

/// PBKDF2 iteration count for BIP-39
pub const PBKDF2_ITERATIONS = 2048;

/// BIP-39 errors
pub const Bip39Error = error{
    InvalidEntropySize,
    InvalidWordCount,
    InvalidWord,
    InvalidChecksum,
    WeakParameters,
    OutputTooLong,
};

/// Get word count from entropy bits
/// Valid entropy: 128, 160, 192, 224, 256 bits
pub fn getWordCount(entropy_bits: u16) Bip39Error!u8 {
    return switch (entropy_bits) {
        128 => 12,
        160 => 15,
        192 => 18,
        224 => 21,
        256 => 24,
        else => Bip39Error.InvalidEntropySize,
    };
}

/// Get entropy bits from word count
/// Valid word counts: 12, 15, 18, 21, 24
pub fn getEntropyBits(word_count: u8) Bip39Error!u16 {
    return switch (word_count) {
        12 => 128,
        15 => 160,
        18 => 192,
        21 => 224,
        24 => 256,
        else => Bip39Error.InvalidWordCount,
    };
}

/// Get entropy byte count from word count
fn getEntropyBytes(word_count: u8) Bip39Error!u8 {
    const bits = try getEntropyBits(word_count);
    return @intCast(bits / 8);
}

/// Find word index in wordlist (binary search)
fn findWordIndex(word: []const u8) ?u11 {
    // Linear search since words aren't sorted alphabetically in BIP-39
    for (wordlist, 0..) |w, i| {
        if (std.mem.eql(u8, w, word)) {
            return @intCast(i);
        }
    }
    return null;
}

/// Convert entropy bytes to mnemonic words
/// Returns slice of word indices that can be used to look up actual words
pub fn entropyToMnemonic(
    entropy: []const u8,
    out_indices: []u11,
) Bip39Error![]u11 {
    // Validate entropy length (must be 16, 20, 24, 28, or 32 bytes)
    const word_count: u8 = switch (entropy.len) {
        16 => 12,
        20 => 15,
        24 => 18,
        28 => 21,
        32 => 24,
        else => return Bip39Error.InvalidEntropySize,
    };

    if (out_indices.len < word_count) {
        return Bip39Error.InvalidEntropySize;
    }

    // Calculate checksum (first CS bits of SHA256 hash)
    // CS = ENT / 32 (e.g., 128 bits -> 4 bits checksum)
    var hash: [32]u8 = undefined;
    Sha256.hash(entropy, &hash, .{});

    const checksum_bits: u8 = @intCast(entropy.len / 4); // ENT/32
    const total_bits: u16 = @as(u16, @intCast(entropy.len)) * 8 + checksum_bits;

    // Each word is 11 bits
    // We need to read 11 bits at a time from entropy + checksum

    var bit_pos: u16 = 0;
    for (0..word_count) |i| {
        var word_idx: u11 = 0;

        // Read 11 bits starting at bit_pos
        for (0..11) |j| {
            const current_bit = bit_pos + @as(u16, @intCast(j));
            const byte_idx = current_bit / 8;
            const bit_idx: u3 = @intCast(7 - (current_bit % 8));

            var bit: u1 = undefined;
            if (byte_idx < entropy.len) {
                bit = @intCast((entropy[byte_idx] >> bit_idx) & 1);
            } else {
                // Reading from checksum
                const cs_byte_idx = byte_idx - entropy.len;
                bit = @intCast((hash[cs_byte_idx] >> bit_idx) & 1);
            }

            word_idx = (word_idx << 1) | bit;
        }

        out_indices[i] = word_idx;
        bit_pos += 11;
    }

    _ = total_bits;
    return out_indices[0..word_count];
}

/// Convert mnemonic words to entropy bytes
/// Returns the entropy portion (without checksum)
pub fn mnemonicToEntropy(
    words: []const []const u8,
    out_entropy: []u8,
) Bip39Error![]u8 {
    const word_count = words.len;

    // Validate word count
    const entropy_bytes = try getEntropyBytes(@intCast(word_count));
    if (out_entropy.len < entropy_bytes) {
        return Bip39Error.InvalidEntropySize;
    }

    // Convert words to indices
    var indices: [24]u11 = undefined;
    for (words, 0..) |word, i| {
        indices[i] = findWordIndex(word) orelse return Bip39Error.InvalidWord;
    }

    // Convert 11-bit indices to bytes
    // Total bits = word_count * 11
    // Entropy bits = word_count * 11 - checksum_bits
    // Checksum bits = entropy_bits / 32
    const total_bits: u16 = @as(u16, @intCast(word_count)) * 11;
    const checksum_bits: u8 = @intCast(total_bits / 33); // CS = ENT / 32, and total = ENT + CS
    const entropy_bits: u16 = total_bits - checksum_bits;

    // Clear output
    @memset(out_entropy[0..entropy_bytes], 0);

    // Extract bits from word indices
    var bit_pos: u16 = 0;
    for (0..word_count) |i| {
        const word_idx = indices[i];

        // Write 11 bits starting at bit_pos
        for (0..11) |j| {
            const current_bit = bit_pos + @as(u16, @intCast(j));
            if (current_bit >= entropy_bits) break;

            const byte_idx = current_bit / 8;
            const bit_idx: u3 = @intCast(7 - (current_bit % 8));
            const bit_shift: u4 = @intCast(10 - j);
            const bit: u8 = @intCast((word_idx >> bit_shift) & 1);

            out_entropy[byte_idx] |= bit << bit_idx;
        }
        bit_pos += 11;
    }

    // Verify checksum
    var hash: [32]u8 = undefined;
    Sha256.hash(out_entropy[0..entropy_bytes], &hash, .{});

    // Extract checksum from last word
    const last_word_idx = indices[word_count - 1];
    const checksum_mask: u11 = (@as(u11, 1) << @intCast(checksum_bits)) - 1;
    const provided_checksum: u8 = @intCast(last_word_idx & checksum_mask);

    // Extract expected checksum from hash
    const expected_checksum: u8 = @intCast(hash[0] >> @intCast(8 - checksum_bits));

    if (provided_checksum != expected_checksum) {
        return Bip39Error.InvalidChecksum;
    }

    return out_entropy[0..entropy_bytes];
}

/// Validate a mnemonic phrase
/// Returns true if the mnemonic is valid (correct words and checksum)
pub fn validateMnemonic(words: []const []const u8) bool {
    var entropy: [32]u8 = undefined;
    _ = mnemonicToEntropy(words, &entropy) catch return false;
    return true;
}

/// Convert mnemonic to 64-byte seed using PBKDF2-HMAC-SHA512
/// Passphrase is optional (use empty string for no passphrase)
pub fn mnemonicToSeed(
    words: []const []const u8,
    passphrase: []const u8,
    out_seed: *[64]u8,
) void {
    // Reconstruct mnemonic string (space-separated words)
    var mnemonic_buf: [256]u8 = undefined;
    var mnemonic_len: usize = 0;

    for (words, 0..) |word, i| {
        if (i > 0) {
            mnemonic_buf[mnemonic_len] = ' ';
            mnemonic_len += 1;
        }
        @memcpy(mnemonic_buf[mnemonic_len..][0..word.len], word);
        mnemonic_len += word.len;
    }

    const mnemonic = mnemonic_buf[0..mnemonic_len];

    // Salt = "mnemonic" + passphrase
    var salt_buf: [256]u8 = undefined;
    const prefix = "mnemonic";
    @memcpy(salt_buf[0..prefix.len], prefix);
    @memcpy(salt_buf[prefix.len..][0..passphrase.len], passphrase);
    const salt = salt_buf[0 .. prefix.len + passphrase.len];

    // PBKDF2-HMAC-SHA512 with 2048 iterations
    pbkdf2(out_seed, mnemonic, salt, PBKDF2_ITERATIONS, HmacSha512) catch unreachable;
}

/// Convert mnemonic string to seed
/// Mnemonic should be space-separated words
pub fn mnemonicStringToSeed(
    mnemonic: []const u8,
    passphrase: []const u8,
    out_seed: *[64]u8,
) Bip39Error!void {
    // Parse words from mnemonic string
    var words: [24][]const u8 = undefined;
    var word_count: usize = 0;

    var iter = std.mem.splitScalar(u8, mnemonic, ' ');
    while (iter.next()) |word| {
        if (word.len == 0) continue;
        if (word_count >= 24) return Bip39Error.InvalidWordCount;
        words[word_count] = word;
        word_count += 1;
    }

    // Validate word count
    _ = try getEntropyBits(@intCast(word_count));

    // Validate words and checksum
    if (!validateMnemonic(words[0..word_count])) {
        return Bip39Error.InvalidChecksum;
    }

    mnemonicToSeed(words[0..word_count], passphrase, out_seed);
}

/// Generate a random mnemonic with the given entropy size
/// entropy_bits must be 128, 160, 192, 224, or 256
pub fn generateMnemonic(
    entropy_bits: u16,
    out_indices: []u11,
) Bip39Error![]u11 {
    const entropy_bytes: u8 = switch (entropy_bits) {
        128 => 16,
        160 => 20,
        192 => 24,
        224 => 28,
        256 => 32,
        else => return Bip39Error.InvalidEntropySize,
    };

    // Generate random entropy
    var entropy: [32]u8 = undefined;
    crypto.random.bytes(entropy[0..entropy_bytes]);

    return entropyToMnemonic(entropy[0..entropy_bytes], out_indices);
}

/// Get the word at a given index
pub fn getWord(index: u11) []const u8 {
    return wordlist[index];
}

/// Convert word indices to mnemonic string
/// Writes space-separated words to output buffer
pub fn indicesToString(indices: []const u11, out: []u8) usize {
    var pos: usize = 0;
    for (indices, 0..) |idx, i| {
        if (i > 0) {
            out[pos] = ' ';
            pos += 1;
        }
        const word = wordlist[idx];
        @memcpy(out[pos..][0..word.len], word);
        pos += word.len;
    }
    return pos;
}

// ============================================================================
// Tests
// ============================================================================

test "getWordCount" {
    try std.testing.expectEqual(@as(u8, 12), try getWordCount(128));
    try std.testing.expectEqual(@as(u8, 15), try getWordCount(160));
    try std.testing.expectEqual(@as(u8, 18), try getWordCount(192));
    try std.testing.expectEqual(@as(u8, 21), try getWordCount(224));
    try std.testing.expectEqual(@as(u8, 24), try getWordCount(256));
    try std.testing.expectError(Bip39Error.InvalidEntropySize, getWordCount(100));
    try std.testing.expectError(Bip39Error.InvalidEntropySize, getWordCount(0));
}

test "getEntropyBits" {
    try std.testing.expectEqual(@as(u16, 128), try getEntropyBits(12));
    try std.testing.expectEqual(@as(u16, 160), try getEntropyBits(15));
    try std.testing.expectEqual(@as(u16, 192), try getEntropyBits(18));
    try std.testing.expectEqual(@as(u16, 224), try getEntropyBits(21));
    try std.testing.expectEqual(@as(u16, 256), try getEntropyBits(24));
    try std.testing.expectError(Bip39Error.InvalidWordCount, getEntropyBits(11));
    try std.testing.expectError(Bip39Error.InvalidWordCount, getEntropyBits(0));
}

test "entropyToMnemonic - all zeros 16 bytes" {
    // All zeros should produce "abandon" x11 + "about"
    const entropy = [_]u8{0} ** 16;
    var indices: [12]u11 = undefined;

    const result = try entropyToMnemonic(&entropy, &indices);
    try std.testing.expectEqual(@as(usize, 12), result.len);

    // First 11 words should be "abandon" (index 0)
    for (0..11) |i| {
        try std.testing.expectEqual(@as(u11, 0), result[i]);
    }
    // Last word "about" is index 3
    try std.testing.expectEqual(@as(u11, 3), result[11]);
}

test "entropyToMnemonic - all zeros 32 bytes" {
    // All zeros 32 bytes should produce "abandon" x23 + "art"
    const entropy = [_]u8{0} ** 32;
    var indices: [24]u11 = undefined;

    const result = try entropyToMnemonic(&entropy, &indices);
    try std.testing.expectEqual(@as(usize, 24), result.len);

    // First 23 words should be "abandon" (index 0)
    for (0..23) |i| {
        try std.testing.expectEqual(@as(u11, 0), result[i]);
    }
    // Last word "art" is index 102
    try std.testing.expectEqual(@as(u11, 102), result[23]);
}

test "mnemonicToEntropy - valid 12-word" {
    // "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "about",
    };

    var entropy: [16]u8 = undefined;
    const result = try mnemonicToEntropy(&words, &entropy);

    // Should be all zeros
    for (result) |b| {
        try std.testing.expectEqual(@as(u8, 0), b);
    }
}

test "mnemonicToEntropy - invalid checksum" {
    // "abandon" x12 - wrong checksum
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
    };

    var entropy: [16]u8 = undefined;
    try std.testing.expectError(Bip39Error.InvalidChecksum, mnemonicToEntropy(&words, &entropy));
}

test "mnemonicToEntropy - invalid word" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "notaword",
    };

    var entropy: [16]u8 = undefined;
    try std.testing.expectError(Bip39Error.InvalidWord, mnemonicToEntropy(&words, &entropy));
}

test "validateMnemonic - valid" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "about",
    };
    try std.testing.expect(validateMnemonic(&words));
}

test "validateMnemonic - invalid checksum" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
    };
    try std.testing.expect(!validateMnemonic(&words));
}

test "validateMnemonic - invalid word" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "notaword",
    };
    try std.testing.expect(!validateMnemonic(&words));
}

test "mnemonicToSeed - BIP-39 test vector 1" {
    // "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
    // with empty passphrase
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "about",
    };

    var seed: [64]u8 = undefined;
    mnemonicToSeed(&words, "", &seed);

    const expected = [_]u8{
        0x5e, 0xb0, 0x0b, 0xbd, 0xdc, 0xf0, 0x69, 0x08, 0x48, 0x89, 0xa8, 0xab, 0x91, 0x55, 0x56, 0x81,
        0x65, 0xf5, 0xc4, 0x53, 0xcc, 0xb8, 0x5e, 0x70, 0x81, 0x1a, 0xae, 0xd6, 0xf6, 0xda, 0x5f, 0xc1,
        0x9a, 0x5a, 0xc4, 0x0b, 0x38, 0x9c, 0xd3, 0x70, 0xd0, 0x86, 0x20, 0x6d, 0xec, 0x8a, 0xa6, 0xc4,
        0x3d, 0xae, 0xa6, 0x69, 0x0f, 0x20, 0xad, 0x3d, 0x8d, 0x48, 0xb2, 0xd2, 0xce, 0x9e, 0x38, 0xe4,
    };

    try std.testing.expectEqualSlices(u8, &expected, &seed);
}

test "mnemonicToSeed - BIP-39 test vector with TREZOR passphrase" {
    // "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
    // with passphrase "TREZOR"
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "about",
    };

    var seed: [64]u8 = undefined;
    mnemonicToSeed(&words, "TREZOR", &seed);

    const expected = [_]u8{
        0xc5, 0x52, 0x57, 0xc3, 0x60, 0xc0, 0x7c, 0x72, 0x02, 0x9a, 0xeb, 0xc1, 0xb5, 0x3c, 0x05, 0xed,
        0x03, 0x62, 0xad, 0xa3, 0x8e, 0xad, 0x3e, 0x3e, 0x9e, 0xfa, 0x37, 0x08, 0xe5, 0x34, 0x95, 0x53,
        0x1f, 0x09, 0xa6, 0x98, 0x75, 0x99, 0xd1, 0x82, 0x64, 0xc1, 0xe1, 0xc9, 0x2f, 0x2c, 0xf1, 0x41,
        0x63, 0x0c, 0x7a, 0x3c, 0x4a, 0xb7, 0xc8, 0x1b, 0x2f, 0x00, 0x16, 0x98, 0xe7, 0x46, 0x3b, 0x04,
    };

    try std.testing.expectEqualSlices(u8, &expected, &seed);
}

test "mnemonicToSeed - legal winner test vector" {
    // "legal winner thank year wave sausage worth useful legal winner thank yellow"
    const words = [_][]const u8{
        "legal",  "winner", "thank", "year",   "wave",   "sausage",
        "worth",  "useful", "legal", "winner", "thank",  "yellow",
    };

    var seed: [64]u8 = undefined;
    mnemonicToSeed(&words, "", &seed);

    const expected = [_]u8{
        0x87, 0x83, 0x86, 0xef, 0xb7, 0x88, 0x45, 0xb3, 0x35, 0x5b, 0xd1, 0x5e, 0xa4, 0xd3, 0x9e, 0xf9,
        0x7d, 0x17, 0x9c, 0xb7, 0x12, 0xb7, 0x7d, 0x5c, 0x12, 0xb6, 0xbe, 0x41, 0x5f, 0xff, 0xef, 0xfe,
        0x5f, 0x37, 0x7b, 0xa0, 0x2b, 0xf3, 0xf8, 0x54, 0x4a, 0xb8, 0x00, 0xb9, 0x55, 0xe5, 0x1f, 0xbf,
        0xf0, 0x98, 0x28, 0xf6, 0x82, 0x05, 0x2a, 0x20, 0xfa, 0xa6, 0xad, 0xdb, 0xbd, 0xdf, 0xb0, 0x96,
    };

    try std.testing.expectEqualSlices(u8, &expected, &seed);
}

test "mnemonicToSeed - letter advice test vector" {
    // "letter advice cage absurd amount doctor acoustic avoid letter advice cage above"
    const words = [_][]const u8{
        "letter", "advice", "cage",   "absurd", "amount", "doctor",
        "acoustic", "avoid", "letter", "advice", "cage",   "above",
    };

    var seed: [64]u8 = undefined;
    mnemonicToSeed(&words, "", &seed);

    const expected = [_]u8{
        0x77, 0xd6, 0xbe, 0x97, 0x08, 0xc8, 0x21, 0x87, 0x38, 0x93, 0x4f, 0x84, 0xbb, 0xbb, 0x78, 0xa2,
        0xe0, 0x48, 0xca, 0x00, 0x77, 0x46, 0xcb, 0x76, 0x4f, 0x06, 0x73, 0xe4, 0xb1, 0x81, 0x2d, 0x17,
        0x6b, 0xbb, 0x17, 0x3e, 0x1a, 0x29, 0x1f, 0x31, 0xcf, 0x63, 0x3f, 0x1d, 0x0b, 0xad, 0x7d, 0x3c,
        0xf0, 0x71, 0xc3, 0x0e, 0x98, 0xcd, 0x06, 0x88, 0xb5, 0xbc, 0xce, 0x65, 0xec, 0xac, 0xeb, 0x36,
    };

    try std.testing.expectEqualSlices(u8, &expected, &seed);
}

test "mnemonicStringToSeed - valid" {
    const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    var seed: [64]u8 = undefined;
    try mnemonicStringToSeed(mnemonic, "", &seed);

    const expected = [_]u8{
        0x5e, 0xb0, 0x0b, 0xbd, 0xdc, 0xf0, 0x69, 0x08, 0x48, 0x89, 0xa8, 0xab, 0x91, 0x55, 0x56, 0x81,
        0x65, 0xf5, 0xc4, 0x53, 0xcc, 0xb8, 0x5e, 0x70, 0x81, 0x1a, 0xae, 0xd6, 0xf6, 0xda, 0x5f, 0xc1,
        0x9a, 0x5a, 0xc4, 0x0b, 0x38, 0x9c, 0xd3, 0x70, 0xd0, 0x86, 0x20, 0x6d, 0xec, 0x8a, 0xa6, 0xc4,
        0x3d, 0xae, 0xa6, 0x69, 0x0f, 0x20, 0xad, 0x3d, 0x8d, 0x48, 0xb2, 0xd2, 0xce, 0x9e, 0x38, 0xe4,
    };

    try std.testing.expectEqualSlices(u8, &expected, &seed);
}

test "mnemonicStringToSeed - invalid checksum" {
    const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon";

    var seed: [64]u8 = undefined;
    try std.testing.expectError(Bip39Error.InvalidChecksum, mnemonicStringToSeed(mnemonic, "", &seed));
}

test "generateMnemonic - generates valid 12-word mnemonic" {
    var indices: [12]u11 = undefined;
    const result = try generateMnemonic(128, &indices);

    try std.testing.expectEqual(@as(usize, 12), result.len);

    // Verify all indices are valid
    for (result) |idx| {
        try std.testing.expect(idx < 2048);
    }

    // Convert to words and validate
    var words: [12][]const u8 = undefined;
    for (result, 0..) |idx, i| {
        words[i] = wordlist[idx];
    }

    try std.testing.expect(validateMnemonic(&words));
}

test "generateMnemonic - generates valid 24-word mnemonic" {
    var indices: [24]u11 = undefined;
    const result = try generateMnemonic(256, &indices);

    try std.testing.expectEqual(@as(usize, 24), result.len);

    // Convert to words and validate
    var words: [24][]const u8 = undefined;
    for (result, 0..) |idx, i| {
        words[i] = wordlist[idx];
    }

    try std.testing.expect(validateMnemonic(&words));
}

test "generateMnemonic - invalid entropy size" {
    var indices: [24]u11 = undefined;
    try std.testing.expectError(Bip39Error.InvalidEntropySize, generateMnemonic(100, &indices));
}

test "indicesToString" {
    var indices = [_]u11{ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3 };
    var buf: [256]u8 = undefined;

    const len = indicesToString(&indices, &buf);
    const expected = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    try std.testing.expectEqualSlices(u8, expected, buf[0..len]);
}

test "entropy round trip" {
    // Start with known entropy
    const original_entropy = [_]u8{
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10,
    };

    // Convert to mnemonic
    var indices: [12]u11 = undefined;
    const mnemonic_indices = try entropyToMnemonic(&original_entropy, &indices);

    // Convert indices to words
    var words: [12][]const u8 = undefined;
    for (mnemonic_indices, 0..) |idx, i| {
        words[i] = wordlist[idx];
    }

    // Convert back to entropy
    var recovered_entropy: [16]u8 = undefined;
    const result = try mnemonicToEntropy(&words, &recovered_entropy);

    try std.testing.expectEqualSlices(u8, &original_entropy, result);
}

test "all valid entropy sizes" {
    const sizes = [_]struct { bits: u16, bytes: u8, words: u8 }{
        .{ .bits = 128, .bytes = 16, .words = 12 },
        .{ .bits = 160, .bytes = 20, .words = 15 },
        .{ .bits = 192, .bytes = 24, .words = 18 },
        .{ .bits = 224, .bytes = 28, .words = 21 },
        .{ .bits = 256, .bytes = 32, .words = 24 },
    };

    for (sizes) |s| {
        var entropy: [32]u8 = undefined;
        crypto.random.bytes(entropy[0..s.bytes]);

        var indices: [24]u11 = undefined;
        const result = try entropyToMnemonic(entropy[0..s.bytes], &indices);

        try std.testing.expectEqual(@as(usize, s.words), result.len);

        // Validate the generated mnemonic
        var words: [24][]const u8 = undefined;
        for (result, 0..) |idx, i| {
            words[i] = wordlist[idx];
        }

        try std.testing.expect(validateMnemonic(words[0..s.words]));
    }
}

test "different passphrases produce different seeds" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "about",
    };

    var seed1: [64]u8 = undefined;
    var seed2: [64]u8 = undefined;
    var seed3: [64]u8 = undefined;

    mnemonicToSeed(&words, "", &seed1);
    mnemonicToSeed(&words, "password", &seed2);
    mnemonicToSeed(&words, "different", &seed3);

    try std.testing.expect(!std.mem.eql(u8, &seed1, &seed2));
    try std.testing.expect(!std.mem.eql(u8, &seed2, &seed3));
    try std.testing.expect(!std.mem.eql(u8, &seed1, &seed3));
}

test "seed derivation is deterministic" {
    const words = [_][]const u8{
        "abandon", "abandon", "abandon", "abandon", "abandon", "abandon",
        "abandon", "abandon", "abandon", "abandon", "abandon", "about",
    };

    var seed1: [64]u8 = undefined;
    var seed2: [64]u8 = undefined;

    mnemonicToSeed(&words, "test", &seed1);
    mnemonicToSeed(&words, "test", &seed2);

    try std.testing.expectEqualSlices(u8, &seed1, &seed2);
}

test "wordlist has 2048 words" {
    try std.testing.expectEqual(@as(usize, 2048), wordlist.len);
}

test "wordlist first and last words" {
    try std.testing.expectEqualSlices(u8, "abandon", wordlist[0]);
    try std.testing.expectEqualSlices(u8, "zoo", wordlist[2047]);
}
