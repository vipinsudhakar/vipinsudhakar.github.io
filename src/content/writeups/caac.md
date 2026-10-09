---
project: caac
summary: "Tamper-evident logs where a change stays local: a Merkle forest that absorbs an insertion with about 62× fewer hashes than the base paper's pipeline."
role: Built the whole system
team: Team of four, Advanced DSA
when: Advanced DSA course, Amrita, 2026
stats:
  - value: "62×"
    label: "fewer hashes than the base paper to absorb an insertion at 100,000 entries"
  - value: "67×"
    label: "fewer for an edit"
  - value: "367"
    label: "tests, all passing"
---

## The question

A log is only useful as evidence if you can show nobody has edited it. Re-hashing every entry to check is O(n). A Merkle tree hashes entries into leaves and each node hashes its two children, so one root commits to every entry, and checking one entry takes an O(log n) proof.

The base paper is Yağız, Horasan and Yurttakal, *Lightweight Tamper-Evident Log Integrity Verification for IoT Edge Environments: A Merkle-Tree Pipeline with Adaptive Chunking* (arXiv:2605.00065, 2026). It sizes batches from memory pressure, smaller when memory is tight, but keeps one global tree and rebuilds it after every batch, so any change costs O(n). The question was whether a log could absorb a change by touching only the part that changed, while keeping the paper's memory-aware sizing.

## What I built

**Content-Anchored Adaptive Chunking (CAAC)**, an Advanced DSA course project at Amrita.

- A Java 21 engine: SHA-256 hashing, Merkle trees, inclusion proofs, a Merkle forest, five chunking strategies and the paper's pipeline as the baseline.
- A benchmark at the paper's sizes, 1k to 100k entries, 5 runs each.
- A Spring Boot API with PostgreSQL, and a React visualiser that only shows what the tested Java engine computes.
- 367 tests.

## How it works

The log is split into **chunks**, each with its own Merkle tree, and the chunk roots are sealed under one **super-root**, the hash published as the trusted anchor. The paper decides how big a chunk may be. CAAC also decides exactly where to cut:

1. **Content-anchored cut points.** CAAC keeps the paper's sizing rule and allows chunks between a quarter and twice its target size. Within that range, a chunk ends after an entry whose leaf hash has its low bits all zero. Whether an entry is an anchor depends only on that entry, so a change cannot move boundaries elsewhere in the log.
2. **One tree per chunk.** A change re-hashes the affected chunk plus the small super-tree, O(c + k), instead of the whole log.

Trees are stored as arrays of levels, so a proof is pure index arithmetic, and every hash increments a counter, so rebuild costs are counted, not estimated.

At 100,000 entries, the SHA-256 operations needed to publish a valid root again after one change:

| | After inserting one entry | After editing one entry |
|---|---:|---:|
| Base paper's pipeline (one global tree) | 100,001 | 100,000 |
| Fixed-size chunking | 100,839 | 1,624 |
| **CAAC** | **1,603** | **1,491** |

That is about **62× fewer hashes** than the base paper for an insertion and about **67× fewer** for an edit. Against fixed-size chunking an edit costs about the same. The difference is insertions, where count-based chunking shifts every later boundary and CAAC re-synchronises after about one chunk.

## My part

I built the whole system: the Java engine and its five chunking strategies, the faithful baseline of the paper's pipeline, the benchmark, the Spring Boot API with PostgreSQL, the React visualiser, and the deployment on Render. The project was a team assignment for the Advanced DSA course.

## What was hard

**Keeping changes local while honouring the paper's sizing.** Time-window and entropy chunking are local too, but they cut 3.7–5.6× more, much smaller chunks, so every rebuild costs 3–5× more, and they ignore the device's memory budget. The paper's own sizing respects the budget, but because it counts entries, an insertion shifts every later boundary. Placing content anchors inside the paper's size range gave both. The caveat, stated up front: when memory pressure changes, the size range, and so some boundaries, change with it.

**A faithful baseline.** I implemented the paper's method as published, including the rebuild after every batch, which makes its ingest slow at large n, and stated that as a caveat instead of changing it. The engine is Java and the paper's is Python, so the comparison uses hash counts, not timings.

## Where it stands

CAAC is done, and the end review is complete. It is live at [caac-cicn.onrender.com](https://caac-cicn.onrender.com) on a free Render instance that sleeps when idle, so the first visit can take a minute or two to wake it.

CAAC extends the adaptive chunking of Yağız, Horasan and Yurttakal (2026). The baseline implements the paper's Eq. 1–2 and Algorithm 1.
