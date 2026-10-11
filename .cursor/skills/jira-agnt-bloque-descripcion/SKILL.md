---
name: jira-agnt-bloque-descripcion
description: >-
  Mantiene el apartado ## AGNT al final de descripciones Jira EDU (briefing
  denso para el agente). Usar al leer/crear/actualizar issues o tras intake.
---

# Jira — bloque AGNT (Nexus-Edu / EDU)

## Convención

| Ubicación | Formato |
|-----------|---------|
| Descripción | Al **final**: encabezado exacto `## AGNT` |
| Comentario | Solo si aporta alcance nuevo |

No pisar el texto humano encima del bloque. Si ya existe `## AGNT`, **reemplazar solo ese bloque**.

## Plantilla

```markdown
## AGNT
schema: agnt-v1
OBJ: <objetivo comprimido>
CTX: <contexto técnico mínimo>
EVOL: <qué cambió en el hilo>
ACT:
- <acción recomendada 1>
- <acción recomendada 2>
DEPS: <faltantes o ok>
NEXT: <siguiente estado / pregunta>
SIG: <señales del hilo>
PUERTA: <repo:no | repo:pendiente-aprobacion | repo:si-aprobado>
```

Español técnico abreviado. Sin secretos ni PII de alumnos.

## Herramientas

- Descripción: `editJiraIssue` / `executeWrite` según MCP
- Comentarios: `addOrEditJiraIssueComment` con `contentFormat: markdown`

cloudId: `c51efaad-12f4-4cac-88b4-4abfa3cabd81` · proyecto `EDU`
