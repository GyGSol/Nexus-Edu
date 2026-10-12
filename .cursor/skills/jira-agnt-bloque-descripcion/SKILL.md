---
name: jira-agnt-bloque-descripcion
description: >-
  Mantiene el apartado ## AGNT al final de descripciones Jira EDU (briefing
  denso + PLAN). Usar al leer/crear/actualizar issues, tras intake o en
  Lista AGNT.
---

# Jira — bloque AGNT (Nexus-Edu / EDU)

## Convención

| Ubicación | Formato |
|-----------|---------|
| Descripción | Al **final**: encabezado exacto `## AGNT` |
| Comentario | Solo si aporta alcance nuevo; el **Plan AGNT** detallado va en comentario (skill `jira-agnt-ticket-unico`) |

No pisar el texto humano encima del bloque. Si ya existe `## AGNT`, **reemplazar solo ese bloque**.

## Plantilla

```markdown
## AGNT
schema: agnt-v1
OBJ: <objetivo comprimido>
CTX: <contexto técnico mínimo>
EVOL: <qué cambió en el hilo>
TIPO: <fix|bug|mejora|pregunta|docs|otro>
PLAN: <plan en 1 línea o bullets muy cortos; detalle en comentario Plan AGNT>
ACT:
- <acción recomendada 1>
- <acción recomendada 2>
DEPS: <faltantes o ok>
NEXT: <siguiente estado / pregunta>
SIG: <señales del hilo>
PUERTA: <repo:no | repo:pendiente-aprobacion | repo:si-aprobado>
```

Tras **Lista AGNT**, `TIPO` y `PLAN` son obligatorios (aunque el plan completo viva en el comentario). Español técnico abreviado. Sin secretos ni PII de alumnos.

## Herramientas

- Descripción: `editJiraIssue` / `executeWrite` según MCP
- Comentarios: `addOrEditJiraIssueComment` con `contentFormat: markdown`

cloudId: `c51efaad-12f4-4cac-88b4-4abfa3cabd81` · proyecto `EDU`
