# Sources and licenses

Asset provider: Poly Haven. Asset license: CC0 1.0 Universal.
Official license: https://polyhaven.com/license
License text: https://creativecommons.org/publicdomain/zero/1.0/legalcode

Assets used:
- https://polyhaven.com/a/brown_planks_03 — diffuse, OpenGL normal and roughness, 2K JPEG.
- https://polyhaven.com/a/forest_ground_04 — diffuse, OpenGL normal and roughness, 1K JPEG.
- https://polyhaven.com/a/bicolour_gravel — diffuse, OpenGL normal and roughness, 2K JPEG.
- https://polyhaven.com/a/fern_02 — glTF with 1K textures.
- https://polyhaven.com/a/flower_gazania — glTF with 1K textures.
- https://polyhaven.com/a/potted_plant_01 — glTF with 1K textures.

Source URLs and SHA-256 hashes for individual files are in textures-manifest.json and models-manifest.json. Downloads were checked against the provider's MD5 values before use. All assets are bundled locally; the application does not request them from the provider at runtime. Models are normalized and placed by the application without changing their original geometry files.

The Three.js GLTFLoader and BufferGeometryUtils use the same Three.js 0.180.0 MIT license already bundled in app/vendor/THREE-LICENSE.txt. Only module import paths were adjusted for local loading.
## Natural lighting and tree pass

- https://polyhaven.com/a/autumn_park — 2K RGBE HDR environment; CC0.
- https://polyhaven.com/a/island_tree_02 — original glTF with 1K textures; CC0. Near and far meshes are derived locally using meshoptimizer 0.24.0, with source files preserved.
- https://github.com/zeux/meshoptimizer — offline geometry simplification; MIT license bundled in scripts/vendor/MESHOPTIMIZER-LICENSE.md. This tool is not loaded by the game.

Raw environment downloads and derived tree files have separate SHA-256 manifests. scripts/optimize-tree.mjs reproduces the derived tree meshes. HDRLoader is from Three.js 0.180.0 under the existing bundled MIT license, with its module import changed to the local path.
- https://polyhaven.com/a/autumn_field_puresky — 2K RGBE HDR sky background, CC0; recorded in sky-manifest.json.

## Hero bridge and contact shading

- https://polyhaven.com/a/modular_wooden_pier — section_01, glTF with 2K textures, CC0. Original source preserved; placement is centered and aligned to the measured deck height (deck.json).
- https://polyhaven.com/a/coast_land_rocks_02 — scanned rocks with 2K textures, CC0. Two derived LODs built by scripts/optimize-rock.mjs; sources and derived files have separate SHA-256 manifests.
- Three.js official addons 0.180.0: EffectComposer, RenderPass, SSAOPass, OutputPass, RoundedBoxGeometry and their dependencies, under the existing MIT license. Import paths point to bundled files only.
Concrete Floor 02 — Rob Tuytel / Poly Haven, CC0. https://polyhaven.com/a/concrete_floor_02 . Local 2K diffuse, OpenGL normal and roughness maps in concrete/. Downloads verified against API MD5; SHA256 recorded in greenhouse-manifest.json.

Landscape PBR textures (2K, diffuse/OpenGL normal/roughness): Rock Face 03 by Dario Barresi and Rico Cilliers, https://polyhaven.com/a/rock_face_03 ; Aerial Grass Rock by Rob Tuytel, https://polyhaven.com/a/aerial_grass_rock . Poly Haven CC0. Downloads verified against API MD5; SHA256 recorded in landscape-manifest.json.
