# Jira EDU — workflow AGNT

## Sitio

| | |
|--|--|
| URL | https://nexus-educacion.atlassian.net |
| Board | https://nexus-educacion.atlassian.net/jira/software/projects/EDU/boards/1 |
| Clave | `EDU` |
| cloudId | `c51efaad-12f4-4cac-88b4-4abfa3cabd81` |
| Cuenta MCP | `gonzalomlopolito@gmail.com` |
| MCP proyecto | `atlassian-nexus-edu` (ver [jira-mcp-auth.md](jira-mcp-auth.md)) |

## Estados verificados (2026-10-11)

| Estado | Categoría | ID | Quién | Uso |
|--------|-----------|-----|-------|-----|
| Por hacer | new | 10000 | Humano | Backlog |
| **Lista AGNT** | indeterminate | 10002 | Humano | Dispara al agente Cursor |
| En curso | indeterminate | 10001 | Humano/dev | Implementación activa |
| **RESPUESTA AGNT** | indeterminate | *pendiente UI (~2 min)* | Agente | Resultado en comentario — MCP no puede crearlo |
| Finalizada | done | 10003 | Humano | Cerrado |

Nombre canónico del disparo: **`Lista AGNT`** (así está en el board). Las skills usan ese nombre.

### Ciclo AGNT

1. Humano → **Lista AGNT**
2. Agente lee ticket + comentarios, publica **Resultado AGNT**, actualiza `## AGNT`
3. Agente → **RESPUESTA AGNT** (cuando exista)
4. Repregunta humana → volver a **Lista AGNT**
5. Validación → **Finalizada**

JQL operativo:

```
project = EDU AND status = "Lista AGNT" ORDER BY updated DESC
```

## Crear RESPUESTA AGNT (manual, ~2 min) — pendiente

MCP no puede crear estados en este proyecto. En la UI:

1. Abrir [board EDU](https://nexus-educacion.atlassian.net/jira/software/projects/EDU/boards/1)
2. **Project settings** → **Work types** / Editar flujo (Tarea e Historia)
3. **Add status** → nombre exacto: `RESPUESTA AGNT` (categoría In Progress)
4. Transiciones: `Lista AGNT` → `RESPUESTA AGNT` → `Lista AGNT` (repregunta) y hacia Finalizada
5. Publicar workflow y mostrar columna en el board
6. Avisar al agente para actualizar IDs en esta doc (`listJiraStatuses`)

Opcional: renombrar `Lista AGNT` → `Lista para AGNT` solo si se actualizan skills/docs a la vez.

## Skills

- `.cursor/skills/jira-agnt-ticket-unico`
- `.cursor/skills/jira-agnt-bloque-descripcion`
- `.cursor/skills/jira-ticket-intake`

Backlog: [jira-stories-backlog.md](jira-stories-backlog.md).
