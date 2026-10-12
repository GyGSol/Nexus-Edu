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
| **RESPUESTA AGNT** | indeterminate | **10004** | Agente | Tras Resultado AGNT en comentario |
| Finalizada | done | 10003 | Humano | Cerrado |

Nombre canónico del disparo: **`Lista AGNT`** (así está en el board). Las skills usan ese nombre.

Aplica a Epic / Story / Task / Subtask (mismos statusIds).

### Ciclo AGNT

1. Humano → **Lista AGNT** (alias en prompts: "Listo para AGNT" / "Lista para AGNT")
2. Agente lee ticket + comentarios, **genera Plan AGNT** (tipo fix/bug/mejora/pregunta/docs + pasos, zonas, criterio de hecho), publica **Resultado AGNT** o **Puerta de codigo** (con el plan dentro), actualiza `## AGNT` (`TIPO` / `PLAN`)
3. Agente → **RESPUESTA AGNT** (id 10004)
4. Repregunta humana → volver a **Lista AGNT** (nuevo ciclo regenera/ajusta el plan)
5. Validación → **Finalizada**

El **Plan AGNT** es obligatorio al disparar desde Lista AGNT: no alcanza con un resumen en el chat; debe quedar en el comentario Jira (plantilla en skill `jira-agnt-ticket-unico`).

JQL operativo:

```
project = EDU AND status = "Lista AGNT" ORDER BY updated DESC
```

## Cómo se creó RESPUESTA AGNT (team-managed)

MCP **no** puede crear estados. En la UI (nombres nuevos: *espacio*, no *proyecto*):

1. Board EDU → **+** a la derecha de las columnas → columna `RESPUESTA AGNT` (categoría En curso), **o**
2. **•••** junto a Nexus-Edu → **Configuración del espacio** → Tipos de trabajo → Editar flujo

Ruta documentada: columna creada 2026-10-11; id verificado con `listJiraStatuses` → **10004**.

## Skills

- `.cursor/skills/jira-agnt-ticket-unico`
- `.cursor/skills/jira-agnt-bloque-descripcion`
- `.cursor/skills/jira-ticket-intake`

## Runbook vivo

[EDU-2](https://nexus-educacion.atlassian.net/browse/EDU-2) permanece **En curso** a propósito (decisión 2026-10-11): guía operativa Cursor ↔ Jira. No pasar a Finalizada aunque el setup esté cumplido; actualizar su descripción si cambian estados, skills o MCP.

Backlog: [jira-stories-backlog.md](jira-stories-backlog.md).
