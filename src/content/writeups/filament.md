---
project: filament
summary: A slime mould simulation on WebGPU, where hundreds of thousands of agents grow glowing networks that you can paint into.
role: Design, WebGPU engine and interface
team: Solo project
when: "2026"
stats:
  - value: "60 fps"
    label: "held on integrated laptop GPUs"
  - value: "4"
    label: "species at once, each with its own senses and speed"
  - value: "8"
    label: "presets on the contact sheet"
---

## The question

*Physarum polycephalum* is a slime mould famous for growing efficient networks between food sources. In a 2010 experiment, Tero et al. placed oat flakes where the cities around Tokyo sit, and the mould grew a network strikingly like the real rail system.

I wanted to know what a slime mould would draw: whether a browser could run enough simple agents, in real time, to watch those networks form and let people push them around.

## What I built

Filament is a toy and a showpiece. Every agent does three things: it **senses** the trail ahead, **turns** towards the strongest scent, and **leaves** a trail of its own. The trails blur and fade, the agents keep reading them, and branching, glowing structures emerge that no single agent planned.

The studio, called the darkroom, hands the print over:

- **Paint into it:** food it grows towards and links up, walls it routes around, repellent it won't cross, and a lure it chases.
- **Mix up to four species**, each with its own senses and speed, and decide who follows whom.
- **Shape the field and the start:** trail lifetime, spread and agent count, grown over scattered food, a typed word or a map of Tokyo.
- **Every run is a link.** The address bar always replays the exact run. You can save a print as a PNG or record the canvas to video.

## How it works

The simulation is raw **WebGPU** and **WGSL**, with no 3D library in between. The interface is React 19 and TypeScript, the engine knows nothing about React, and the site is static on GitHub Pages. Each step is three passes:

1. **Agents.** One GPU thread per agent samples the trail at three sensors, turns, moves and deposits into its species' channel. Each species weighs the four trail channels through a 4×4 interaction matrix, which is how species attract or repel each other.
2. **Diffuse.** Every cell blurs towards its 3×3 neighbourhood and decays, and food emits scent. The pass reads one trail buffer and writes the other, then the two swap.
3. **Brush.** Strokes paint into the world layer over just the brush's bounding box.

The image is drawn in stages: an HDR scene pass, a quarter-resolution bloom, then a composite that tone maps, vignettes and dithers. Uniform structs are generated from one TypeScript definition, so the WGSL and the packing code can't drift apart.

## What was hard

Two goals pulled against each other: hold **60 fps on integrated laptop GPUs** (measured on Intel Xe), and make every run **reproducible** enough to share as a link.

Performance came mostly from not doing work:

- **Single-cell sensors.** The field is already blurred every step, so averaging a patch around each sensor looks nearly identical and costs about 2.5× the step time.
- **Empty worlds aren't read.** The world layer is skipped until something is painted or generated, which halves the memory reads.
- **Capped work per frame.** At most 60 steps a second on any display, pixel density capped at 1.25×, and bloom at quarter resolution.

Reproducibility meant the GPU's scheduling could not be allowed to matter. A seeded PCG hash is shared line for line between TypeScript and WGSL. Deposits are fixed-point atomics, so the order in which threads land can't change the result, and the deposit scale is chosen per run so the worst case can't overflow 32 bits. The same parameters, seed and grid replay bit-for-bit on the same GPU, and a check script confirms that presets do.

## Where it stands

Filament is live at [vipinsudhakar.github.io/filament](https://vipinsudhakar.github.io/filament/) and released under the MIT License. It needs WebGPU: current Chrome, Edge and Safari, and Firefox 141 or newer. Other browsers see a recording instead.

The agent model follows Jeff Jones, *Characteristics of pattern formation and evolution in approximations of Physarum transport networks* (2010). The Tokyo map is after Tero et al., *Rules for biologically inspired adaptive network design*, Science (2010).
