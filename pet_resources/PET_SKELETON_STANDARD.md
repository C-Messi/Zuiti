# Zuiti Pet Package Standard

`pet_resources/` is the canonical pet package root. A pet package contains its complete skeleton, expression SVGs, prop skills, memory seed files, motion tool definitions, and prompt-facing motion descriptions.

Renderer code must not expose the whole `pet_resources/` directory as a public asset root. The main process loads and validates pet packages, then sends a read-only render package to the renderer over IPC. Runtime memory and generated skills remain main-process private state.

## Directory Layout

```text
pet_resources/
  PET_SKELETON_STANDARD.md
  pets/<pet_id>/
    manifest.json
    skeleton/
      parts/*.svg
      expressions/*.svg
    memory/
      SOUL.md
      memory.example.md
      memory.md        # runtime-local, ignored
    skills/
      example-soft-wave/
        manifest.json
        skill.md
        prop.svg
```

## Manifest Data

`manifest.json` must declare:

- `id`, `title`, `viewBox`, and `ariaLabel`.
- `parts`: every renderable skeleton component with `label`, relative SVG `path`, and `transformOrigin`.
- `expressions`: mood-specific replacement SVGs for expression parts such as `face`.
- `anchors`: prop anchor coordinates owned by the current pet.
- `renderOrder`: stable SVG group order; every entry must exist in `parts`.
- `motionTools`: semantic tools with `id`, `prompt`, parameter limits, default duration, targets, and transform keyframes.
- `moodDefaults`: fallback `motion_plan` per mood, using only registered tools.

## SVG Parts

Each skeleton part file contains a single transparent SVG group, not a full `<svg>` document. The group id must follow `zuiti-part-<part-id-with-dashes>`, for example `left_foot` uses `<g id="zuiti-part-left-foot">`.

Part and expression SVGs must not include scripts, `foreignObject`, event attributes, external links, remote resources, data URL resources, or embedded images.

## Motion Tools

Motion tools are data, not system code. Each tool declares prompt guidance, numeric parameter ranges, target part ids, and transform-only keyframes. Targets may use `__root` for the whole rendered pet or concrete part ids from `parts`.

The LLM may only request `motion_plan: { skeleton_id, commands }` using tools registered by the active pet package. It must not emit raw SVG, arbitrary CSS, arbitrary transforms, file paths, or unregistered part ids.

## Memory And Skills

`memory/SOUL.md` is the pet persona source. `memory/memory.md` is runtime-generated long-term memory and must stay local. Prop skills live under the pet package `skills/` directory so each pet carries its own learned props and anchors.
