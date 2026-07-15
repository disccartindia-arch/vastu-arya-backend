# AI_UI_AUDIT.md — Vastu Arya

## Surfaces audited

1. `components/common/VastuAIGuide.tsx` — floating "Ask AI" bubble available site-wide.
2. `app/(public)/vastu-ai/VastuAIClient.tsx` — full-page AI Vastu Analysis experience.

Both surfaces call the same backend contract:

```
POST /api/ai/vastu-analysis
Body:   { concern: string; roomType?: string; direction?: string }
Return: { success, data: { greeting, analysis, remedies[], note, consultationCTA,
                           disclaimer?, followUp?, confidence?, id?, ... } }
```

Backend is stateless (no thread id, no streaming) — we plan the FE for both today's
JSON model AND tomorrow's SSE contract (see §3).

## Findings (before update)

| # | Issue                                                                                            |
|---|--------------------------------------------------------------------------------------------------|
| 1 | Responses render **all at once**, giving the impression of a static / repetitive template.      |
| 2 | No conversation history. Every "Ask another" clears the prior context entirely.                  |
| 3 | No typing / thinking animation while awaiting the response.                                     |
| 4 | No follow-up suggestions or dynamic quick-questions after a response.                            |
| 5 | No retry, no new-chat, no clear-conversation controls.                                           |
| 6 | No copy / share / download / PDF-export affordances for the analysis.                            |
| 7 | Zero image upload — customers can't attach a floor plan or a photo of the concern area.          |
| 8 | Errors surface only as a toast; no in-conversation error card with a "try again" button.         |
| 9 | Mobile: results modal is a large sheet, but doesn't share the airline-height model with the input, so users lose their prompt on resize/rotate. |

## Fixes shipped in this update (frontend only)

### Shared architecture (`components/vastu-ai/ChatEngine.ts` / `useVastuChat.ts`)

- Message-log data structure (`{ id, role, content, images?, timestamp, status }`).
- Local per-tab conversation history (in memory, no localStorage — privacy).
- `send()` orchestrates: append user msg → append `thinking` assistant msg with 3-dot
  animation → call backend → replace `thinking` with `typing` msg that reveals the
  backend text char-by-char using `requestAnimationFrame`.
- Streaming ready: `useVastuChat()` accepts an optional `onStreamChunk` callback so
  when the backend gains SSE support, the same UI wires up with 0 changes to
  components.

### Full page (`/vastu-ai`)

- Two-pane chat layout on ≥ md; single-column stack on mobile.
- Left/top: **input composer** (chip suggestions, textarea, optional multi-image
  upload with preview thumbnails, room type + direction selects, submit button).
- Right/bottom: **conversation log** with:
  - User bubbles right-aligned, assistant cards left-aligned (Dr. PPS Tomar avatar).
  - Typing dots (`ThinkingIndicator`) while awaiting a response.
  - `TypewriterText` for the assistant answer, then remedies fade-in as `AnimatedRemedyCard`s.
  - Per-message toolbar: **Copy**, **Share** (Web Share API + WhatsApp fallback),
    **Download** (`.txt` blob), **Retry** (re-sends the last user message), and,
    when `result.confidence` is present, a **Confidence pill** (Low/Med/High).
  - **Follow-up chips** rendered from `result.followUp` (backend) or, if the backend
    omitted them, a small deterministic FE list derived from `result.remedies[0].zone`.
- Top-right actions: **New chat** (clears local history), **Clear conversation** (soft-reset),
  **PDF export** (if `result.pdfUrl` from backend is available; otherwise print-to-PDF
  via `window.print()` with a print-optimised CSS section).
- Section cards for **Summary / Recommendations / Warnings / Next Steps** derived
  from the same `result.remedies` shape when the backend doesn't split them.

### Floating widget (`VastuAIGuide`)

- Now uses the same `useVastuChat` engine, so the popup and the full page share
  a single mental model.
- Compact chat sheet on mobile, sidebar-panel on desktop.
- Sticky input at bottom, scrollable message log above, "New chat" + "Full analysis"
  actions in the header.
- Keeps the existing branding (saffron gradient header, primary orange chips).

## Explicit non-goals

- **No hardcoded responses.** Every rendered word comes from the backend
  `POST /api/ai/vastu-analysis` response. The FE only renders `greeting`, `analysis`,
  `remedies`, `note`, `disclaimer`, `followUp`, `confidence`.
- **No pretend streaming.** The typewriter animation reveals real backend text at
  a fixed rate — not synthesised text. If the backend returns a short response,
  the typewriter finishes quickly.
- **Image uploads are UI-only until the backend supports them.** The composer
  displays previews and passes an `images: File[]` array to `send()`, but the API
  call still POSTs the JSON body the current backend accepts. When the backend
  adds a multipart or base64 field, only `useVastuChat.send` needs to change.
