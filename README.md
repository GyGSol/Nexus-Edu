# Nexus-Edu

Dashboard de escritorio (Electron + React) para evaluación cualitativa de alumnos (escala D / AV / AL / EP / NO), con base SQLite embebida sembrada desde la planilla Excel de 1°C.

## Stack

- Electron (electron-vite)
- React 19 + TypeScript 5
- Tailwind CSS 4 + paleta Tierra
- React Hook Form + Zod
- better-sqlite3
- electron-builder
- Playwright / Vitest

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Build instalable

```bash
# Linux (AppImage + deb)
pnpm dist

# Windows (NSIS + portable) — en Windows o cross-build desde Linux
pnpm dist:win
```

Artefactos: `dist/nexus-edu-*-setup.exe` / `*-portable.exe`.  
Guía: [docs/export-backup-windows.md](docs/export-backup-windows.md) (instalación Windows hecha; smoke funcional pendiente).

## Tests

```bash
pnpm test:unit
pnpm build && pnpm test:e2e
```

## Datos locales

SQLite en `userData` (Linux: `~/.config/nexus-edu/data/`, Windows: `%APPDATA%\nexus-edu\data\`).  
Sidebar: **Respaldar base** / **Restaurar base**. Reimportar Excel conserva flags PPI.
## Escala de calificación

| Código | Significado | Orden |
|--------|-------------|-------|
| D | Destacado | 1 (mayor) |
| AV | Avanzado | 2 |
| AL | Alcanzado | 3 |
| EP | En Proceso | 4 |
| NO | No alcanzó los objetivos | 5 |

**PPI** (alumno): Proyecto Pedagógico Individual (CUD). Default: No.

**Valoración por dimensiones** (ficha Alumno): pautas D/AV/AL/EP/NO/NC/PPI por concepto-materia. En el Excel, el token `NO` de las cadenas de detalle significa *No corresponde a la clasificación del bimestre* (`NC`), no “No alcanzó”. Guía: [docs/valoracion-dimensiones.md](docs/valoracion-dimensiones.md).

## Jira

- Sitio: [nexus-educacion.atlassian.net](https://nexus-educacion.atlassian.net/jira/software/projects/EDU/boards/1)
- Proyecto: **EDU**
- MCP proyecto: `atlassian-nexus-edu` en `.cursor/mcp.json` — auth: [docs/jira-mcp-auth.md](docs/jira-mcp-auth.md)
- Workflow AGNT: [docs/jira-workflow-edu.md](docs/jira-workflow-edu.md)
- Backlog / historias: [docs/jira-stories-backlog.md](docs/jira-stories-backlog.md)
- Cuenta MCP: `gonzalomlopolito@gmail.com`
