---
name: nexus-edu
description: >
  Nexus-Edu project conventions: Electron evaluation dashboard, qualitative grades D>AV>AL>EP>NO,
  PPI field, Tierra palette, SQLite seed from Excel. Trigger: any Nexus-Edu feature work.
metadata:
  author: nexus-edu
  version: "1.0"
  scope: nexus-edu
---

# Nexus-Edu

Desktop DSS for 1°C student evaluation.

## Stack

electron-vite, React 19, TypeScript, Tailwind 4, RHF + Zod, better-sqlite3, electron-builder, Playwright.

## Domain

### Escala agregada (dashboard / nota por área legacy)

| Code | Meaning | Rank |
|------|---------|------|
| D | Destacado | 1 (best) |
| AV | Avanzado | 2 |
| AL | Alcanzado | 3 |
| EP | En Proceso | 4 |
| NO | No alcanzó los objetivos | 5 |

### Pautas por dimensión (UI Alumnos)

`ASSESSMENT_MARKS`: D, AV, AL, EP, **NO** (no alcanzó), **NC** (no corresponde a la clasificación del bimestre), PPI_NO, PPI_SI.

- Catálogo: `src/shared/dimensiones.ts` (30 slots; PPI en Lengua/Matemática/Conoc. del Mundo).
- Persistencia: `assessments.dimension_key` · doc: `docs/valoracion-dimensiones.md`.
- **Excel**: token `NO` en cadena de detalle (`AV - AL - NO`) → **`NC`**, no Grade NO. Futuro Excel: `NAO`/`NO_OBJ` → NO.
- Seed: si DB sin dimensiones, `ensureSeeded` reimporta (`merge`). UI **Reimportar Excel** = `replace`.

- **PPI alumno**: boolean `Student.ppi` default `false` (CUD). Distinto de fila PPI por materia.
- Seed Excel: `resources/planilla_base__datos_alumnos.xlsx` → SQLite `userData` (`~/.config/nexus-edu/data/`).

## Related project skills

Use sibling skills in `.cursor/skills/`: `electron`, `react-19`, `typescript`, `tailwind-4`, `zod-4`, `playwright`, `notebooklm-nexus-edu`, `nlm-skill`.

Documentación grounded en NotebookLM (cuaderno Nexus-Educación): ver `notebooklm-nexus-edu` y `docs/notebooklm.md`.

## Commands

```bash
pnpm dev
pnpm test:unit
pnpm test:e2e
pnpm dist
```
