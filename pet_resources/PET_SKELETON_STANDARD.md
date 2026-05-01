# Zuiti Pet Skeleton Resource Standard

This directory contains renderer-served pet skeleton resources. Electron app icons and build assets stay in `resources/`; pet skeleton parts, motion metadata, and prompt-facing notes stay in `pet_resources/`.

## Directory Layout

```text
pet_resources/
  PET_SKELETON_STANDARD.md
  skeletons/<skeleton_id>/
    manifest.json
    parts/
      head.svg
      ears.svg
      tail.svg
```

## Manifest Data

`manifest.json` is the resource index for one skeleton. It must declare:

- `id`: currently `default-cat`.
- `requiredParts`: part ids that must load before the resource package is accepted.
- `renderOrder`: stable SVG group order, including generated static parts and resource parts.
- `parts`: per-part data with `label`, relative SVG `path`, and CSS `transformOrigin`.
- `motionTools`: semantic motion tools that the LLM may request.

The renderer loads the manifest first, then loads each declared SVG path. If any required part is missing or unsafe, the system falls back to the built-in default cat markup.

## SVG Parts

Each part SVG file contains a single transparent SVG group, not a full `<svg>` document. The group id must be stable:

- `head.svg`: `<g id="zuiti-part-head">...</g>`
- `ears.svg`: `<g id="zuiti-part-ears">...</g>`
- `tail.svg`: `<g id="zuiti-part-tail">...</g>`

Part SVGs must not include scripts, `foreignObject`, event attributes, external links, remote resources, or data URL resources. The art style for the default cat is a high-consistency cow-cat style: thick dark outline, cream fill, black patches, and soft pink ear or tail accents.

## Motion Tools

Motion tools are semantic, not freeform transforms. The current part-specific tools are:

- `tilt_head`: rotates `head`, `face`, and `ears` together.
- `perk_ears`: lifts and rotates `ears`.
- `swish_tail`: rotates `tail`.

New parts may add new semantic tools, but those tools must also be added to shared types, main-process validation, renderer CSS, and prompt instructions.

## Prompt Boundary

Prompt text should expose only the registered semantic `motionTools`. The LLM must keep using `motion_plan: { skeleton_id, commands }` and must not emit raw SVG, arbitrary CSS, arbitrary transforms, file paths, or unregistered part ids.
