# Wand Knowledge

Challenge 2: Answer UI with Trust & Provenance. A frontend-only prototype for asking a question, inspecting the evidence, and understanding what is missing.

## Demo

https://github.com/alexSv42/wand-answer-ui/releases/download/v1.0.0/wand-demo.mp4

[▶ Watch the demo on the Releases page](https://github.com/alexSv42/wand-answer-ui/releases/tag/v1.0.0) if the embedded player does not load.

## Run locally

Requires Node.js 22+ and npm. Tested with Node.js 24.

```sh
npm ci
npm run dev
```

Open the localhost URL printed by Vite. The server binds to `127.0.0.1`, so it is available on this computer only. No account, environment variables, API key, or backend is needed.

```sh
npm run build
npm run preview
```

The production output is the static `dist/` folder. This project has not been uploaded or deployed.

## Try it

The four example questions demonstrate the required high-confidence, low-confidence, missing-information, and irrelevant-source cases. Open a numbered source to see its exact excerpt and the passage in its original document.

“Explore demo scenarios” exposes the remaining edge cases, including service failures, incomplete metadata, missing documents, invalid offsets, zero confidence, and conflicting confidence/completeness signals. The slow-request scenario lets you submit a second question while the first is pending. Failure scenarios inject a failure into that request; retry makes a normal request.

All policy text is fictional sample data. The assignment PDF was provided without a starter repository, so `src/mock.ts` supplies the permitted in-memory mock. Its keyword routing selects fixed answers; it performs no search or answer generation. Questions outside the sample topics receive a missing-information response.

## Design and architecture

React + TypeScript, Vite, Zod, Lucide icons, and plain CSS. No router, global store, component framework, or markdown engine is needed for this single-screen workflow.

* `src/App.tsx`: form, examples, and a discriminated union for idle/loading/success/error. Only the current request can publish a result. Starting another request or unmounting aborts the previous one.
* `src/AnswerView.tsx`: answer, confidence, completeness, citations, and suggestions. Citation selection and demo checklist state stay local to the result.
* `src/SourceDrawer.tsx`: native modal `dialog`, exact excerpt, source context, and citation navigation. Native modal behavior supplies focus containment, Escape, and return focus. Citation buttons explicitly take focus before opening so Safari has the correct return target. The scrollable source text is keyboard-focusable. Close/backdrop controls work with touch; arrow keys navigate citations with a physical keyboard.
* `src/answer.ts`: Zod contract and two pure presentation helpers. Types are inferred from the schema. Missing/null optional text and arrays normalize at the boundary; malformed values yield a recoverable error.
* `src/mock.ts`: source documents, fixtures, and an abortable async answer function. Replace this function with the supplied endpoint when available; presentation code does not need to change.
* `src/styles.css`: shared colors, spacing patterns, controls, and responsive layouts. Local system fonts; no remote font or asset requests.

The page prioritizes question → answer → evidence → next action. The initial examples expose useful queries instead of presenting an empty box alone. Low-confidence and incomplete results use explanatory text as well as color. The source drawer occupies the full viewport on phones and a bounded panel on desktop. Textareas stay at least 16px on phones to avoid automatic input zoom.

## Trust decisions and corner cases

* Confidence is supplied data. `0` is displayed as zero; null/absent scores remain unknown. The 80% visual threshold is a documented presentation choice, not a calibrated measure of correctness. The disclosure explains this.
* Completeness is independent of confidence. `missing_info: true` or an empty answer produces incomplete behavior even with a high score. Low confidence alone does not invent a missing-information flag.
* Suggestions appear only for incomplete answers. Clicking one adds it to an in-memory demo checklist and explicitly says that nothing was sent or uploaded. Opaque `action` strings are never executed as code or URLs.
* All citations remain inspectable. A missing document preserves its excerpt and clearly states that full-source verification is unavailable. Missing citations never imply the answer is verified.
* The frontend does not determine semantic relevance. The irrelevant-source fixture supplies a note explaining the limitation; the UI preserves that note and distinguishes retrieved material from evidence that supports an answer. A production service would need to supply claim/support metadata for stronger assertions.
* Highlighting requires the exact snippet at the supplied offset. Invalid/absent offsets, mismatches, or empty snippets disable highlighting without hiding the source. Offsets are assumed to be zero-based JavaScript UTF-16 string positions; confirm this convention with the real API.
* Optional root `note` holds the mock’s missing-information explanation. The PDF does not name that field or specify the shape of `action`; this mock uses a string for each action. These assumptions belong in the API adapter if the starter contract differs.
* Query length is bounded, whitespace-only requests are prevented, long text wraps, and React renders query/answer/source strings as text rather than HTML.
* Abort handling prevents an old request from replacing a newer answer. Cancel returns to the examples; retry retains the submitted question.

## Verification

```sh
npx playwright install chromium webkit
npm test
```

The suite includes contract/helper checks and browser checks on desktop Chromium (1440px), Android-sized Chromium (390px), tablet Chromium (768px), and iPhone-sized WebKit (390px). Additional checks cover 320, 360, 520, 1024, and 1920px widths. These are emulated viewports, not physical-device tests.

Browser coverage includes all four core fixtures, optional/null fields, unavailable sources, invalid offsets, empty excerpts, zero/unknown confidence, contradictory signals, retry, cancellation, stale requests, long input, text escaping, keyboard interaction, focus restoration, and horizontal overflow. Axe checks the main states, error states, and source dialog. Runtime console errors and outbound requests are checked while exercising the demo scenarios.

```sh
npm test -- --project desktop
npm test -- --project contracts
npx playwright show-report
```

The HTML report is local. Failed tests retain screenshots and traces in ignored folders. Reduced motion is enabled during automated checks to keep layout assertions stable.

Verified locally: the production build succeeds and the full suite reports 90 passed, 5 skipped. The skips avoid repeating the extra width matrix outside the desktop project and omit physical-keyboard checks from the two phone profiles; equivalent checks run on desktop/tablet. No runtime console errors or outbound requests were observed in the scenario sweep.

## Scope and trade-offs

The core workflow and fixture coverage take priority over conversational history, ratings, persistence, document upload, and real integrations. There is no backend, LLM call, retrieval pipeline, authentication, or telemetry. User-entered questions and demo actions stay in memory and reset on reload.

Sources are short local text documents, so ordinary rendering is sufficient; pagination, virtualized documents, and a document framework would add complexity without helping this prototype. Plain text avoids a markdown renderer and HTML sanitization surface. The fixture contract does not map individual claims to citations, so citations are listed at answer level rather than inventing inline claim mappings.

Before extending this beyond a prototype, confirm the real API contract, confidence calibration, offset units, relevance metadata, and enrichment-action behavior. Manual screen-reader and physical-device testing would supplement the automated checks.
