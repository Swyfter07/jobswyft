# _reference/ — Read-Only Component Snapshots

These files are **exact copies** of the original component implementations from `components/custom/` before the EXT.2 reorganization.

## Purpose

- Preserve original component behavior and design intent for reference during the EXT epic
- Allow future stories to consult original implementations without git archaeology

## Rules

- **DO NOT** import from this directory anywhere in the codebase
- **DO NOT** add exports for these files to `index.ts`
- **DO NOT** modify these files — they are read-only snapshots
- This directory will be deleted after all EXT stories are complete
