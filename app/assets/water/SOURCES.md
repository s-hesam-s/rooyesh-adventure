# Water rendering assets

The water shader, planar reflection/refraction components and normal maps are bundled locally from the official three.js r180 repository:
- examples/jsm/objects/Water2.js
- examples/jsm/objects/Reflector.js
- examples/jsm/objects/Refractor.js
- examples/textures/water/Water_1_M_Normal.jpg
- examples/textures/water/Water_2_M_Normal.jpg

Repository: https://github.com/mrdoob/three.js/tree/r180
License: https://github.com/mrdoob/three.js/blob/r180/LICENSE

The existing bundled three.js MIT license is retained. Vendor source changes only rewrite imports to the local runtime. Application-specific flow timing, quality selection, exclusion of first-person objects, edge tint, wave strength and resource management live in app/src/render/riverWater.js. manifest.json records the exact source URLs and SHA256 hashes of delivered files. All runtime assets are local; no external request is required while playing.
