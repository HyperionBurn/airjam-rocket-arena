# Model credits

Models by [Jako / fairlight51](https://sketchfab.com/fairlight51), licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/):

- [Fennec - Rocket League Car](https://sketchfab.com/3d-models/fennec-rocket-league-car-5b43b50b6eeb4a12a29671df3418f57a)
- [Octane - Rocket League Car](https://sketchfab.com/3d-models/octane-rocket-league-car-9910f0a5d158425bbc7deb60c7a81f69)
- [Ball - Rocket League](https://sketchfab.com/3d-models/ball-rocket-league-2c8911aa1dcd4c53bad842f2d354dfe2)

Changes: welded and simplified car geometry with a 0.3% mesh-radius error limit; 1024-pixel texture cap and lossless WebP encoding; removal of unused PBR maps; game-coordinate conversion; default-car matte toon shading; separated wheel animation and existing game boost effects. Original downloads retained under art-review/sketchfab-source. No endorsement by the creator is implied.

Fennec update: uses the pearl preview’s 84,823-triangle normalized model, simplified to 47,143 triangles with a 0.1% mesh-radius error limit and locked mesh borders, retaining UVs, normals and embedded textures. Wheels are split by quadrant for animation; positions are converted to the existing game envelope. The preview’s graphite rim atlas and GGX pearl/clearcoat equations are adapted for the park lighting.
# Fennec Pearl v2 baseline

The full v2 model in `fennec-v2/model.glb` is imported from the supplied Fennec Pearl v2 viewer, retaining the Jako CC BY 4.0 geometry, textures, authored normals, and baked occlusion. The untouched viewer at `/fennec-pearl-v2.html` retains its embedded credits. The compact pearl lighting atlas derives from that viewer's precomputed HDR environment.

# Vanguard reference rebuild

`vanguard/model.glb` is the complete procedurally authored vehicle geometry from the user-supplied Vanguard reference rebuild. It retains 134,408 triangles, authored normals and UVs, baked vertex occlusion, and the source material grouping. The integration separates the four wheel assemblies for gameplay animation and converts the reference coordinates to the game's existing vehicle units. It does not reuse the original Fennec vertices or textures.

# Vesper reference car

`vesper/model.glb` is imported from the user-supplied `vesper/reference-car-v2.glb` and named Vesper in the garage. The original source GLB is kept beside the normalized runtime copy. The import retains its 48,922 triangles, embedded tire/normal/carbon textures, PBR material data and authored wheel pivots. Its axes, scale and rear-wheel labels are normalized for the game; Vesper uses the Octane-family hitbox.

# Dodge Challenger SRT8

`challenger/model.glb` is the user-supplied Dodge Challenger SRT8 model. The game preserves its embedded textures and separate wheel assemblies, then converts its source axes and scale at load time. It uses the Dominus-family hitbox.
