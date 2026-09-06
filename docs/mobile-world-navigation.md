# Mobile project context and navigation

September 6, 2026. Local follow-up to the published studio archive. Replaces the visual-only mobile project selector; desktop composition is retained.

## Visitor flow

- A visible introduction explains that each island is a project by Chingis. Every world has a project title and one sentence connecting the miniature to the actual work, in English and German.
- Drag the island to rotate it. A separately labeled swipe strip below the model changes worlds; these gestures never compete on the same surface.
- Previous/Next buttons show the neighboring project names. Both arrows and horizontal swipes wrap continuously through all six worlds. The index and six-segment indicator show the visitor's position.
- The swipe strip also supports keyboard Left/Right. Vertical and strongly diagonal gestures are rejected; a gesture that begins as vertical scrolling cannot later become navigation. Pointer cancellation and lost capture clear the gesture.
- The project link now has a visible action label. Inspection, pause/reset and ger finishes are under the labeled 3D controls disclosure.
- Selecting a different world resets inspection zoom, retains the shared Canvas, and updates the existing shareable world query. Subtle directional title motion respects reduced-motion preferences.

## Layout and performance

Mobile uses normal-flow grid rows for context, the 3D stage and navigation, rather than overlapping absolute overlays. The stage has a 220px minimum height. Short screens can scroll naturally instead of shrinking text or clipping navigation. Explicit zero-minimum grid columns avoid the Canvas retaining an old width after device rotation or viewport resizing.

No carousel dependency, duplicate canvases or eager model loading added. Existing lazy model caching, DPR limits and demand rendering remain. Desktop keeps its full project index, caption and view tools.

## Verification

```powershell
npm run build
node --test scripts/world-navigation.test.mjs scripts/audio-controller.test.mjs scripts/security-headers.test.mjs scripts/turntable-motion.test.mjs scripts/project-assets.test.mjs
```

Production build and all 30 tests pass. The six new tests cover wrapping, swipe direction, short/diagonal rejection, vertical-scroll cancellation, secondary pointers and translated context for every world. Existing HomeInfo image-lint and Browserslist notices remain.

Chromium checks: 390x844 English, 320x740 German, 1280x900 desktop; no horizontal overflow. Browser pointer drags verify next, previous and first-to-last wrapping. Arrow buttons cycle all six worlds; keyboard wrap, separate model dragging, zoom reset on selection, and locale continuity checked. Final checked browser error logs were empty. Physical touch, Safari and actual device orientation remain unverified.

Implemented locally on main; not committed, pushed or deployed in this follow-up.
