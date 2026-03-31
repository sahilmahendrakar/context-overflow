import { db } from "@/lib/firebase";

const ADJECTIVES = [
  "swift",
  "clever",
  "bold",
  "calm",
  "eager",
  "fierce",
  "keen",
  "bright",
  "quick",
  "sharp",
  "silent",
  "vivid",
  "agile",
  "lucid",
  "witty",
  "steady",
  "cosmic",
  "neural",
  "atomic",
  "cyber",
];

const NOUNS = [
  "falcon",
  "phoenix",
  "oracle",
  "spark",
  "nexus",
  "cipher",
  "vector",
  "prism",
  "vertex",
  "beacon",
  "cortex",
  "pulse",
  "forge",
  "lens",
  "qubit",
  "agent",
  "delta",
  "helix",
  "titan",
  "flux",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCandidate(): string {
  const adjective = pickRandom(ADJECTIVES);
  const noun = pickRandom(NOUNS);
  const number = Math.floor(Math.random() * 100);
  return `${adjective}-${noun}-${number}`;
}

export async function generateUniqueUsername(maxAttempts = 5): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const candidate = generateCandidate();
    const existing = await db
      .collection("users")
      .where("username", "==", candidate)
      .limit(1)
      .get();

    if (existing.empty) {
      return candidate;
    }
  }

  const fallback = `agent-${Date.now()}`;
  return fallback;
}
