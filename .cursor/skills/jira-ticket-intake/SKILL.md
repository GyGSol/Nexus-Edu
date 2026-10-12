---
name: jira-ticket-intake
description: >-
  Analiza tickets Jira EDU al iniciar trabajo: hechos, reglas, faltantes y
  Plan AGNT (fix/bug/mejora). Documenta en docs/. Lee ## AGNT si existe.
  Trigger: URL/clave EDU-NN, "Lista AGNT", "Listo para AGNT" o "empezar
  desde ticket Jira".
---

# Jira Ticket Intake — Nexus-Edu

## Objetivo

Antes de implementar, convertir descripción + comentarios del ticket **EDU** en insumo técnico trazable **y un plan de trabajo**.

## Flujo

1. Leer issue completo y comentarios (cronológico).
2. Separar texto humano del bloque final `## AGNT` (skill `jira-agnt-bloque-descripcion`).
3. Extraer: hechos confirmados, reglas pedagógicas/producto, restricciones, faltantes.
4. Clasificar cada punto: `confirmado` | `parcial` | `faltante`.
5. Si el ticket está en **Lista AGNT** (o el usuario dispara intake desde ese estado): generar **Plan AGNT** — tipo (`fix` / `bug` / `mejora` / `pregunta` / `docs` / `otro`), objetivo, alcance in/out, pasos, zonas/archivos, riesgos/tests, criterio de hecho, puerta de código. Plantilla canónica en skill `jira-agnt-ticket-unico`.
6. Actualizar `docs/` con clave `EDU-NN` (incluir el plan) y, si aplica, el bloque `## AGNT` en Jira (`PLAN:` + `ACT:`).
7. Si el disparo es el flujo AGNT completo, publicar el plan en el comentario Jira vía `jira-agnt-ticket-unico` (no solo en chat/`docs/`).

## Sitio

- Sitio: `https://nexus-educacion.atlassian.net`
- cloudId: `c51efaad-12f4-4cac-88b4-4abfa3cabd81` (**único válido**)
- Proyecto: `EDU` — Nexus-Edu
- MCP: preferir servidor **`atlassian-nexus-edu`** (`getJiraIssue`, `searchJiraIssuesUsingJql`, `addOrEditJiraIssueComment`, `editJiraIssue`)
- **No** usar Feel Ibiza (`feelibizaproperties` / `ffa44cf1-…`). Si el plugin marketplace solo lista ese sitio → reconectar `atlassian-nexus-edu` ([docs/jira-mcp-auth.md](../../../docs/jira-mcp-auth.md)).

## Calidad

- No asumir reglas de escala, PPI/CUD ni exportación de boletines si no están explícitas.
- Marcar bloqueantes MVP (3–5) cuando aplique.
- El plan debe ser ejecutable (pasos concretos), no un resumen del título del ticket.
- Sin PII real de alumnos en docs (usar ejemplos anonimizados).
