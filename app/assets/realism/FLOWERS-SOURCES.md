# Flower model sources

- Flower Empodium: https://polyhaven.com/a/flower_empodium
  Authors: Jenelle van Heerden (photography), Rico Cilliers (modeling).
- Periwinkle Plant: https://polyhaven.com/a/periwinkle_plant
  Author: Amal Kumar.
- License: CC0. https://polyhaven.com/license

Original 1K glTF files and their dependencies were obtained through the official Poly Haven API. Source MD5 values were checked on download; local SHA256 values are recorded in flowers-manifest.json. Runtime model and texture references are local.

Original node variants are used separately rather than as one display collection. Far versions were derived with the existing local meshoptimizer runtime using scripts/optimize-flowers.mjs. Per-asset optimization.json and derived-manifest.json record the resulting geometry and hashes. Source files remain available.

Runtime adjustments: shared material/texture references across near/far models; common reference bounds for scale alignment; small instanced clusters; material transparency replaced by alpha testing for opaque leaf geometry (the Periwinkle COLOR_0 alpha values are all 1). Spatial variation and scene placement are application code. No new runtime library was installed.