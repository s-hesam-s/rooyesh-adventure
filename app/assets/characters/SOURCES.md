# Character asset

Michelle.glb was obtained from the official three.js r180 example assets:
https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/models/gltf/Michelle.glb

This is a Mixamo character, used as an embedded game character. Adobe's Mixamo FAQ describes royalty-free use of characters and animations in video games:
https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html

The character is not a CC0 asset. It is not offered as an independent asset library. The original file is retained for reproducibility. guide.gltf, guide.bin and guide-*.jpg/png are local extractions made by scripts/prepare-guide.mjs; no geometry or image data is changed. manifest.json records SHA256 hashes. The original dance animation is not used. The game applies a relaxed arm pose and procedural idle movement.

SkeletonUtils.js comes from three.js r180 under MIT; the existing three.js license applies. Only its import path was changed to the bundled local runtime.
