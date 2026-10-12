---
name: jira-agnt-ticket-unico
description: >-
  Flujo ticket único AGNT para EDU: en Lista AGNT genera Plan AGNT
  (fix/bug/mejora) y Resultado AGNT en comentario Jira (no solo chat).
  Trigger: "revisar Jira", "Lista AGNT", "Listo para AGNT", EDU-NN.
---

# Jira AGNT ticket único — Nexus-Edu

## Regla de entrega

**Nunca** dar por cumplido un ticket respondiendo **solo** en el chat de Cursor. Publicar comentario en el issue (`addOrEditJiraIssueComment` o MCP `atlassian-nexus-edu`) y actualizar `## AGNT` en la descripción.

## Estados (board EDU — verificados)

Ver `docs/jira-workflow-edu.md`.

| Estado | Quién | ID |
|--------|-------|-----|
| Por hacer | Humano | 10000 |
| **Lista AGNT** | Humano dispara | 10002 |
| En curso | Humano/dev | 10001 |
| **RESPUESTA AGNT** | Agente tras Resultado AGNT | 10004 |
| Finalizada | Humano cierra | 10003 |

Nombre canónico del disparo en este board: **`Lista AGNT`**. Alias aceptados en prompts: "Lista para AGNT", "Listo para AGNT".

## Flujo

1. JQL: `project = EDU AND status = "Lista AGNT" ORDER BY updated DESC`.
2. Leer descripción + `## AGNT` + comentarios cronológicos.
3. Priorizar **Pregunta AGNT** sin respuesta.
4. **Generar Plan AGNT** (obligatorio en Lista AGNT): clasificar tipo (fix / bug / mejora / pregunta / docs / otro) y proponer pasos concretos antes de pedir aprobación o cerrar análisis. Publicar el plan dentro del comentario Jira (sección `## Plan AGNT`); no dejarlo solo en el chat.
5. Si requiere código: comentario **Puerta de codigo** (incluye el Plan AGNT) + mención a @Gonzalo Lopolito; **no** implementar hasta aprobación.
6. Si no requiere código: comentario **Resultado AGNT** completo (incluye el Plan AGNT o "n/a — solo análisis").
7. Transicionar a **RESPUESTA AGNT** (id 10004).
8. Actualizar bloque `## AGNT` (OBJ/EVOL/ACT/PLAN/DEPS/NEXT) — skill `jira-agnt-bloque-descripcion`.

## Plantilla Plan AGNT (obligatoria en Lista AGNT)

Incluir siempre que el ticket esté en **Lista AGNT**, aunque el trabajo sea solo análisis.

```markdown
## Plan AGNT
**Tipo:** fix | bug | mejora | pregunta | docs | otro
**Objetivo:** <qué queda resuelto si el plan se cumple>
**Alcance:**
- In: …
- Out: …
**Pasos:**
1. …
2. …
3. …
**Zonas / archivos probables:**
- `<ruta o módulo>`
**Riesgos / tests:**
- …
**Criterio de hecho:**
- …
**Puerta de código:** no | pendiente-aprobacion | n/a
```

Adaptar los pasos al tipo: reproducción→causa→fix (bug), cambio acotado→validación (fix/mejora), respuestas + faltantes (pregunta), sync docs (docs).

## Plantilla Resultado AGNT

```markdown
## Resultado AGNT
**Ticket:** EDU-NN
**Resumen:** …
**Hechos:** …
**Faltantes:** …
**Recomendación:** …
**Próximo paso:** …

## Plan AGNT
… (plantilla de arriba)
```

## Plantilla Puerta de codigo

```text
Resultado AGNT — Revision previa a cambios en el repositorio

Este pedido implica cambios en el codigo o archivos versionados de Nexus-Edu.
No aplico cambios en el repo hasta decision explicita.

Resumen del pedido interpretado:
- <alcance>

## Plan AGNT
Tipo: <fix|bug|mejora|…>
Objetivo: <…>
Pasos:
1. …
2. …
Zonas / archivos probables:
- <rutas>
Criterio de hecho:
- …
Puerta de código: pendiente-aprobacion

@Gonzalo Lopolito ¿Aprobamos seguir adelante con este cambio en el repo?
```

## Guardrails

- No publicar PII real de alumnos (DNI, teléfonos, domicilios) en comentarios Jira.
- Cambios en repo solo tras aprobación explícita de @Gonzalo Lopolito en el hilo.
- Trazabilidad `EDU-NN` en commits/PR post-aprobación.
- MCP: servidor **`atlassian-nexus-edu`** (cloudId abajo). **Prohibido** Feel Ibiza (`feelibizaproperties` / `ffa44cf1-…`).

## Sitio

- Sitio: `https://nexus-educacion.atlassian.net`
- Board: https://nexus-educacion.atlassian.net/jira/software/projects/EDU/boards/1
- cloudId: `c51efaad-12f4-4cac-88b4-4abfa3cabd81` (único válido en Nexus-Edu)
- Proyecto: `EDU`
- Si el plugin marketplace solo lista Feel Ibiza → no usarlo; conectar `atlassian-nexus-edu` ([docs/jira-mcp-auth.md](../../../docs/jira-mcp-auth.md)).
