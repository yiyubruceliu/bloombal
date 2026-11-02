# Major-01 — below-fold trio (shipped)

## Shipped
1. **Demo play overlay** — control moved to toolbar under the video (never covers media). Mobile confirmed.
2. **Proof dedupe** — removed duplicate `process-still` from Solution; Solution = process rail only; Demo = video (poster `demo-frames/01.png`).
3. **Splyt scrub (below fold only)**  
   - Problem headline word-color scrub  
   - Process titles left-wipe clip scrub  
   - Desktop: pin demo + circle expand (18% → 100%); mobile full frame, no pin  
   - Hero spectacle still parked  
   - `prefers-reduced-motion`: static finals

## Verify
- Playwright: `.impeccable/trio-*.png`
- `playBelow: true`, `overlapsVideo: false`, no page errors
- Hard refresh `http://localhost:8080/`
