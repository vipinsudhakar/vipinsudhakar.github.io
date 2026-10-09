---
project: strand
summary: Paste a protein or DNA sequence and get its key properties from Biopython, plus a 3D structure predicted by ESMFold.
role: Backend, frontend and deployment
team: Solo project
when: "2026"
stats:
  - value: "1000×"
    label: "error in the old DNA molecular weight, now fixed"
  - value: "10–400"
    label: "residues accepted for ESMFold folding"
  - value: "14"
    label: "backend tests"
---

## The question

The first version of Strand was a single HTML file. All the maths ran in the browser in hand-written JavaScript, and it called the ESMFold API straight from the client. It worked, but the numbers weren't trustworthy.

The isoelectric point was a linear guess clamped between 4 and 10. The DNA molecular weight formula was off by roughly a factor of a thousand. And with the folding call in the browser, there was nowhere to validate input or store anything. So the question was simple: what would it take for the numbers on screen to be ones I could trust?

## What I built

I rewrote it as a full-stack app: paste in a sequence and it works out the properties that matter.

For **proteins**:

- Molecular weight, isoelectric point, and extinction coefficient (reduced and oxidised).
- A composition breakdown: hydrophobic, charged and polar.
- 3D structure prediction with ESMFold, rendered with 3Dmol and coloured by per-residue confidence (pLDDT), so you can see which parts of the fold to trust.

For **DNA**:

- GC content, melting temperature (nearest-neighbour) and double-stranded molecular weight.
- Transcription to RNA and translation to protein, with start and stop codon detection.
- A hand-off that sends the translated protein straight to the folding tool.

Both tools come with sample sequences, six proteins and four DNA sequences, and every analysis is saved to a history.

## How it works

The backend is **FastAPI**. Biopython does the science, SQLModel and SQLite store the history, and httpx proxies the ESMFold API. The frontend is React, Vite and TypeScript, with Tailwind for styling, Framer Motion for animation and 3Dmol for the structure viewer.

The decisions that shaped it:

- **The science runs on the server**, in Biopython, not in hand-written browser JavaScript.
- **The browser never calls ESMFold directly.** Folding goes through my backend, which gives me a place to validate input (folding accepts 10 to 400 residues) and to save each structure so it can be fetched again later.
- **No login.** History is scoped to your browser with an anonymous id kept in local storage. The frontend generates a UUID and sends it as an `X-Client-Id` header with its API requests.
- **One service, one origin.** The app deploys as a single Docker service: FastAPI serves the API and the built frontend from the same origin, so there is one URL and no CORS to configure.

The backend has 14 tests, and the frontend build doubles as a type-check.

## What was hard

The hard part was the numbers themselves: working out which of the old ones were wrong, and accepting that fixing them would change the outputs. Each change below is deliberate:

- **Isoelectric point.** It was a linear heuristic clamped to 4–10. It now uses a pKa-based model, so the value can land anywhere.
- **DNA melting temperature.** It was one Wallace-style formula for everything. It now uses nearest-neighbour thermodynamics, which drifts further from the old number the longer the sequence gets.
- **DNA molecular weight.** The old `length × 0.65` was wrong by about 1000×. It now reports the actual double-stranded mass.
- **Extinction coefficient.** The reduced value matches the old one. The oxidised value is new.

Protein molecular weight, GC content and the composition percentages should still line up with the original. I wrote each of these changes down in the project's README, so that anyone comparing the two versions reads a different number as a correction rather than a regression.

## Where it stands

Strand is live at [strand-0rgw.onrender.com](https://strand-0rgw.onrender.com). It runs on Render's free tier, which sleeps when idle, so the first request after a quiet spell takes 30 to 60 seconds to wake it, and the analysis history is cleared whenever the service restarts.

One known limitation remains: switching between the two tools resets that tool's state, so a structure has to be folded again if you navigate away and come back.
