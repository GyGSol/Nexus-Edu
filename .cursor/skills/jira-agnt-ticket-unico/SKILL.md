---
name: jira-agnt-ticket-unico
description: >-
  Flujo ticket único AGNT para EDU: Resultado AGNT en comentario Jira (no solo
  chat). Trigger: "revisar Jira", "Lista AGNT", EDU-NN.
---

# Jira AGNT ticket único — Nexus-Edu

## Regla de entrega

**Nunca** dar por cumplido un ticket respondiendo **solo** en el chat de Cursor. Publicar comentario en el issue (`addOrEditJiraIssueComment` o MCP `atlassian-nexus-edu`) y actualizar `## AGNT` en la descripción.

## Estados (board EDU — verificados)

Ver `docs/jira-workflow-edu.md`.

| Estado | Quién | ID (aprox.) |
|--------|-------|-------------|
| Por hacer | Humano | 10000 |
| **Lista AGNT** | Humano dispara | 10002 |
| En curso | Humano/dev | 10001 |
| **RESPUESTA AGNT** | Agente tras Resultado AGNT | *crear en UI si falta* |
| Finalizada | Humano cierra | 10003 |

Nombre canónico del disparo en este board: **`Lista AGNT`** (no "Lista para AGNT").

## Flujo

1. JQL: `project = EDU AND status = "Lista AGNT" ORDER BY updated DESC`.
2. Leer descripción + `## AGNT` + comentarios cronológicos.
3. Priorizar **Pregunta AGNT** sin respuesta.
4. Si requiere código: comentario **Puerta de codigo** + mención a @Gonzalo Lopolito; **no** implementar hasta aprobación.
5. Si no requiere código: comentario **Resultado AGNT** completo.
6. Transicionar a **RESPUESTA AGNT** si existe; si no, dejar el issue y pedir crear el estado (EDU-4 / UI).
7. Actualizar bloque `## AGNT` (OBJ/EVOL/ACT/DEPS/NEXT).

## Plantilla Resultado AGNT

```markdown
## Resultado AGNT
**Ticket:** EDU-NN
**Resumen:** …
**Hechos:** …
**Faltantes:** …
**Recomendación:** …
**Próximo paso:** …
```

## Plantilla Puerta de codigo

```text
Resultado AGNT — Revision previa a cambios en el repositorio

Este pedido implica cambios en el codigo o archivos versionados de Nexus-Edu.
No aplico cambios en el repo hasta decision explicita.

Resumen del pedido interpretado:
- <alcance>

Archivos o zonas probablemente afectadas:
- <rutas>

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
