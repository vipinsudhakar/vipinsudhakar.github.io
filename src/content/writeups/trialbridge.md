---
project: trialbridge
summary: Gemma 4 reads a cancer patient's reports, then checks the patient rule by rule against the plausible trials recruiting in India.
role: Application architecture and AI integration
team: Team Latent, four people
when: Hacktoberfest Hack Day Coimbatore, October 2026
stats:
  - value: "26 s"
    label: "for one trial check, down from about 3 minutes"
  - value: "42 s"
    label: "to check four trials in parallel"
  - value: "20 → 4"
    label: "candidate trials narrowed to full checks for the breast cancer sample"
---

## The question

Clinical trials give cancer patients new treatments at no cost, often at major hospitals in India, yet trials struggle to find patients and patients rarely know the trials exist. Each trial lists pages of eligibility rules, such as "ECOG 0–1" or "no active brain metastases".

The rules are public on ClinicalTrials.gov, but matching one patient means reading every rule of every recruiting trial for their cancer. A patient can't do that, and a busy oncologist rarely has the time.

## What we built

TrialBridge turns photos of a patient's reports into a short list of trials worth asking their oncologist about.

- Gemma 4 reads the reports and prescriptions into a structured profile: cancer type, stage, biomarkers, treatment history, ECOG, labs and current medicines, each with the exact text it was read from.
- The user checks and corrects that profile. Nothing is matched until a person has reviewed it.
- The app pulls every recruiting trial for that cancer with an Indian site that is open or about to open, drops the ones the patient can't join because of age or sex, sets aside clear mismatches, and checks the patient against each eligibility rule of the rest separately.
- Each trial ends up as a **likely match**, a **possible match** with questions for the doctor, or **not eligible** with the rule that rules it out.

It never claims eligibility: every result says to confirm with the oncologist.

## How it works

The app is Next.js 16 on Vercel, calling Gemma 4 through the Gemini API. The central decision was that **the model judges rules, and code decides the outcome**.

- **Rule splitting in plain code.** Each trial's loosely formatted eligibility text is split into individual inclusion and exclusion rules.
- **One narrow question per rule.** Gemma answers yes, no or unknown for each rule, with a reason and evidence. Unit-tested match logic turns the answers into a status, so the interface can show exactly which rule ruled a trial out.
- **No double negatives.** For an exclusion rule, the model is asked whether the exclusion applies, and the code flips the answer.
- **Every rule must be answered.** Replies are validated with zod, and one that skips a rule is rejected and retried, so a missed rule never quietly becomes "possible".
- **A quick first look.** One short call sets aside trials clearly meant for a different group of patients, with a reason. For the breast cancer sample, about 20 trials narrowed to 4 full checks in our run.

## My part

My part was application architecture and AI integration: the Next.js application structure, the Gemini and Gemma integration, medical-document extraction, prompt development and API error handling. The extraction prompt, for example, tells the model to copy values as written, use null for anything not stated, and quote its evidence. The rest of Team Latent built trial retrieval and matching, the frontend and accessibility, and the patient workflow, testing and documentation.

## What was hard

Latency was the first wall. With default settings, checking 4–5 trials in parallel took about 3 minutes per trial. With thinking set to minimal, one check took 26 s and used no thinking tokens. We wrote the medical connections into the prompt instead (stage IV means metastatic, HER2 IHC 1+ is HER2-negative), and a batch of 4 trials finished in 42 s.

Hosting limits mattered too. All Gemma attempts in one request, retries included, share a fixed time budget: 55 s within the 60 s limit for a rule check. A slow reply ends in a clear JSON error rather than a hosting timeout. When the free tier says slow down, the API answers `429` with Gemma's suggested wait, and the interface retries that trial by itself.

## Where it stands

We built TrialBridge on 8 October 2026 at Hacktoberfest Hack Day Coimbatore. It is live at [trialbridge-beta.vercel.app](https://trialbridge-beta.vercel.app), with three synthetic sample patients so you can try it without real reports. It runs on Gemma's free tier, so under heavy use it may ask you to wait a minute.

It is a screening aid, not medical advice.
