---
name: notebooklm-nexus-edu
description: >-
  Cuaderno NotebookLM "Nexus-Educación" como fuente documental solo de este
  proyecto. Trigger: NotebookLM, notebook Google, docs del proyecto fuera del
  repo, "preguntá al cuaderno", sync fuentes docs/.
metadata:
  author: nexus-edu
  version: "1.0"
  scope: nexus-edu
---

# NotebookLM — Nexus-Educación

## Cuaderno canónico

| | |
|--|--|
| Título | Nexus-Educación |
| ID | `d3b34e36-c736-483b-89e4-0e57eb06e7dc` |
| URL | https://notebook.google.com/notebook/d3b34e36-c736-483b-89e4-0e57eb06e7dc |
| Cuenta | `gonzalomlopolito@gmail.com` |
| MCP | `notebooklm-nexus-edu` |
| Perfil CLI | `nexus-edu` |
| Config | `.notebooklm/config.json` |
| Auth | `docs/notebooklm.md` |

## Reglas

1. Para Q&A documental de Nexus-Edu, usar **este** notebook_id (o alias `nexus-edu`). No crear otro cuaderno salvo pedido explícito.
2. Preferir MCP `notebooklm-nexus-edu` (`notebook_query`, `source_add`, …). Si no hay MCP, CLI con env del proyecto (ver abajo).
3. Detalle de comandos/Studio: skill hermana `nlm-skill`.
4. Nunca subir a NotebookLM: PII real de alumnos, `.env`, tokens, `.cursor/*-auth/`.
5. Fuentes locales habituales: `README.md`, `docs/`.

## CLI (mismo storage que el MCP)

```bash
export PATH="$HOME/.local/bin:$PATH"
export NOTEBOOKLM_MCP_CLI_PATH="/home/magnetico/Nexus/Nexus-Edu/.cursor/notebooklm-mcp-auth"
export NLM_PROFILE="nexus-edu"

nlm notebook query d3b34e36-c736-483b-89e4-0e57eb06e7dc "pregunta"
nlm source add d3b34e36-c736-483b-89e4-0e57eb06e7dc --file docs/algun-doc.md
```

## Auth

Si falla auth → seguir `docs/notebooklm.md` (`nlm login --profile nexus-edu`).
