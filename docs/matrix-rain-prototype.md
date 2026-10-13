# Matrix rain study

Question: can slow typographic rain add character to the existing portfolio while keeping the work and writing dominant, including when gravity follows a phone's orientation?

Throwaway branch: `codex/matrix-rain-prototype`. No variant has been chosen for production.

## Review

```sh
npm run prototype:rain
```

Open `http://localhost:3104/en/about?variant=margin` (also works on other portfolio routes and `/de/about`). The floating development controls switch compositions with buttons or ← / →, pause animation, and compare the original page. The URL retains the selected composition across reloads.

| Variant | Composition |
| --- | --- |
| `margin` | Fine letter trails along the edges; a quiet reading area. |
| `field` | Sparse, separated groups of glyphs across the viewport. |
| `syntax` | Small horizontal code fragments drifting as whole units. |

Sage, slate and stone inks sit behind the foreground. Glyphs are small, stable and unlit. The stack is paper → fixed, noninteractive canvas (`z-index: 0`) → portfolio (`1`) → prototype controls (`100`). The existing typography, content and scene surfaces stay foreground elements.

## Phone gravity

Start with ordinary downward rain. Tap **Use phone motion** to opt in; the browser may ask for motion/orientation permission. No permission request or sensor subscription happens on page load. Denied permission, missing readings or an unsupported browser leave ordinary rain running. **Stop phone motion** returns to ordinary rain. Nothing is stored or sent from sensor readings.

Orientation supplies a projected gravity vector in screen coordinates, including portrait/landscape rotation. The particles integrate velocity and position with drag; they bend into the new direction rather than rotating the canvas. A flat phone has almost no gravity in the screen plane, so the rain settles. Glyphs remain upright to the screen and the content mask remains fixed.

Motion permission requires a secure context on supporting browsers. For an actual phone, use an HTTPS preview; a plain `http://192.168…` development URL is insufficient. Sensor support and permission prompts vary by browser. The prototype's generic variant switcher is development-only; a production build requires an explicit `?variant=margin`, `field`, or `syntax`, and retains the separate opt-in phone-motion control.

Reduced motion keeps a static frame and disables phone motion. Animation is capped at 20 FPS and canvas pixel density at 1.5. Pause, hidden pages and reduced motion suspend the animation loop; sensor listeners also suspend while paused or hidden.

## Verification and verdict

Checked 2026-10-13: optimized Next.js build, TypeScript/lint and all five existing SEO tests passed (one pre-existing `HomeInfo` image warning). Chromium screenshots at 1440px and 390px show readable foreground and no mobile overflow. Simulated phone checks passed for opt-in, denial, missing readings, portrait, both landscape directions, upside-down, flat settling, pause/resume, stop, reduced motion, URL reload and original comparison. Production-mode checks confirm the effect is query-gated, developer controls are hidden, Pause remains available, and the home/EN/DE About routes load without page errors. No persistent test suite was added for this throwaway study.

Verdict pending Chingis' visual review. The code is a prototype, not a chosen production treatment. Browser simulations can check permission handling and gravity direction; physical iOS/Android feel and native permission prompts still require a real phone.

References: [W3C Device Orientation and Motion](https://www.w3.org/TR/orientation-event/), [MDN permission method](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static).
