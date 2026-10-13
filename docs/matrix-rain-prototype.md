# Matrix rain study

Question: can slow typographic rain add character to the existing portfolio while keeping the work and writing dominant, including when gravity follows a phone's orientation?

Throwaway branch: `codex/matrix-rain-prototype`. No variant has been chosen for production.

## Review

```sh
npm run prototype:rain
```

Open `http://localhost:3104/en?variant=syntax` (also works on other portfolio routes and `/de/about`). The floating development controls switch compositions with buttons or ← / →, pause animation, and explicitly Hide/Show rain. The URL retains the selected composition across reloads.

| Variant | Composition |
| --- | --- |
| `margin` | Fine letter trails along the edges; a quiet reading area. |
| `field` | Sparse, separated groups of glyphs across the viewport. |
| `syntax` | Vertical letter streams for words; `()`, `{}`, `[]` and other symbol groups stay together. |

Muted green, slate and stone inks sit behind the foreground. Medium-weight 12–16px glyphs fall at 16–28px/s, with leading opacity of 54–78% and a short fade at the viewport's top and bottom. The stack is paper → fixed, noninteractive canvas (`z-index: 0`) → portfolio (`1`) → prototype controls (`100`). Opaque paper behind reading blocks, navigation, menus and scene controls fully shields their text. Open space around the ready 3D model remains transparent; its fallback poster is hidden only while the model is ready.

## Phone gravity

Start with ordinary downward rain. Tap **Use phone motion** to opt in; the browser may ask for motion/orientation permission. No permission request or sensor subscription happens on page load. Denied permission, missing readings or an unsupported browser leave ordinary rain running. **Stop phone motion** returns to ordinary rain. Nothing is stored or sent from sensor readings.

Orientation supplies a projected gravity vector in screen coordinates, including portrait/landscape rotation. The particles integrate velocity and position with drag; they bend into the new direction rather than rotating the canvas. A flat phone has almost no gravity in the screen plane, so the rain settles. Glyphs remain upright to the screen and protective paper surfaces stay attached to the content.

Motion permission requires a secure context on supporting browsers. For an actual phone, use an HTTPS preview; a plain `http://192.168…` development URL is insufficient. Sensor support and permission prompts vary by browser. The prototype's generic variant switcher is development-only; a production build requires an explicit `?variant=margin`, `field`, or `syntax`, and retains the separate opt-in phone-motion control.

Reduced motion keeps a static frame and disables phone motion. Animation is capped at 20 FPS and canvas pixel density at 1.5. Pause, hidden pages and reduced motion suspend the animation loop; sensor listeners also suspend while paused or hidden.

Visibility follow-up: after the earlier faint edge-only treatment, Chingis requested clearly visible rain and completely clear reading surfaces. The centre fade is now removed; real opaque paper surfaces protect content. Vertical words read top-to-bottom under normal gravity, bend with their fall direction, and retain upright letters. Paired punctuation stays horizontal. A visible preview continues animating while focus moves to the chat. Only page visibility, pause and reduced motion suspend rendering.

## Verification and verdict

Latest visibility/word-layout checks: TypeScript and five SEO tests passed; desktop/home and phone/About browser checks confirmed opaque reading surfaces, no overflow and visible rain in open space. An on/off screenshot comparison of the 342×300px About introduction had zero changed bytes. Scene controls are opaque; direct dark `.btn` surfaces keep their contrast. Sensor logic is unchanged; this follow-up did not repeat physical phone or native permission tests.

Checked 2026-10-13: optimized Next.js build, TypeScript/lint and all five existing SEO tests passed (one pre-existing `HomeInfo` image warning). Chromium screenshots at 1440px and 390px show readable foreground and no mobile overflow. Simulated phone checks passed for opt-in, denial, missing readings, portrait, both landscape directions, upside-down, flat settling, pause/resume, stop, reduced motion, URL reload and original comparison. Production-mode checks confirm the effect is query-gated, developer controls are hidden, Pause remains available, and the home/EN/DE About routes load without page errors. No persistent test suite was added for this throwaway study.

Verdict pending Chingis' visual review. The code is a prototype, not a chosen production treatment. Browser simulations can check permission handling and gravity direction; physical iOS/Android feel and native permission prompts still require a real phone.

References: [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/), [MDN permission method](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
