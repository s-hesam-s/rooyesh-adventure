# River water reflection pass

The river now renders the surrounding scene into planar reflection and refraction textures. Two local normal maps provide continuous flow; world-aligned UV coordinates keep ripple size consistent along the channel. A subtle irregular shoreline tint softens the water edge.

## Changes

- Added `app/src/render/riverWater.js` with explicit reflection/refraction target lifecycle, quality switching, camera-frustum rejection and shared animation time.
- High quality uses two 768 x 768 targets. The lighter quality uses a physical material without the two additional scene renders. First-person hands, carried objects and the player avatar are excluded from reflection/refraction. Scene override passes skip water captures.
- Reduced-motion preference freezes water animation. Existing pause time controls also control water flow.
- Added 320 instanced riverbed pebbles and world-aligned riverbed UVs in `riverScene.js`.
- Lowered the background terrain base from -0.85 to -0.95: it previously covered the riverbed at -0.86, exposing the grass material through clear water.
- Added official Three.js r180 Water2, Reflector and Refractor modules and two normal maps. All files load locally; sources, license reference and checksums are in `app/assets/water/`.
- Added seven water checks and included them in `Test.cmd`.

## Verification

- Full portable Node test command: 48 passed, 0 failed.
- Checks include plane normal and UV orientation, deterministic cyclic flow, quality switching, idempotent render-target disposal, frustum exclusion, riverbed pebble placement, local asset hashes, and terrain clearance across the riverbed.
- Browser: continued the synthetic customer journey, collected the identity badge, entered the allocation river scene, inspected water from the bridge, and switched high -> lighter -> high quality without console errors or warnings.
- Screenshots: `water-reflection-pass.png` and `water-low-quality-pass.png`, captured from the actual running game at 1280 x 720.
- The independent local game only was edited. No source, database or runtime integration with the original financial project was changed or introduced.

## Limits

This is planar water rendering, not fluid simulation or ray tracing. The complete environment and first-person hand geometry still need further art work to approach AAA fidelity. No hardware-wide frame-rate benchmark, prolonged memory stress test or audio listening test was performed in this pass.