# Payloads para crear historias EDU (MCP)

Usar cuando `getAccessibleAtlassianResources` incluya `https://nexus-educacion.atlassian.net`  
cloudId: `c51efaad-12f4-4cac-88b4-4abfa3cabd81`

Por cada fila: `createJiraIssue` con `projectKey=EDU`, `contentFormat=markdown`, descripción = sección humana + bloque AGNT de [jira-stories-backlog.md](jira-stories-backlog.md).

| Orden | issueType | summary | labels |
|------:|-----------|---------|--------|
| 1 | Task | Configurar estados AGNT y workflow Cursor | agnt, setup |
| 2 | Story | Dashboard de métricas de evaluación | mvp, dashboard |
| 3 | Story | Gestión de alumnos y seed desde Excel | mvp, alumnos, seed |
| 4 | Story | Evaluación cualitativa por área y bimestre | mvp, evaluacion |
| 5 | Story | Flag PPI (Proyecto Pedagógico Individual) | mvp, ppi |
| 6 | Story | Empaquetado instalable Linux | release, electron-builder |
| 7 | Story | Tests Vitest + Playwright | qa, tests |
| 8 | Story | Exportación de boletines / reportes | next, export |
| 9 | Story | Backup y restauración de SQLite | next, datos |
| 10 | Story | Importar catálogo de frases finales desde hoja Excel FRASE FINAL | mvp, frases, seed |
| 11 | Story | Mostrar frase final por bimestre resolviendo código contra catálogo | mvp, frases, ui |
| 12 | Story | Valoración final por bimestre: valoraciones por área + frase final | mvp, frases, valoracion, ui |
| 13 | Story | Dimensiones de valoración por concepto/materia | mvp, evaluacion, dimensiones, ui |

Si `Story` no existe en el proyecto, usar `Task` para todas.

Tras crear: actualizar tabla **Claves creadas** en `jira-stories-backlog.md` y `mem_save`.
