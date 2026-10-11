# NotebookLM — Nexus-Edu (cuaderno del proyecto)

## Objetivo

Usar el cuaderno **Nexus-Educación** como fuente de información y documentación **solo de este proyecto**, con la cuenta `gonzalomlopolito@gmail.com`.

| | |
|--|--|
| Título | Nexus-Educación |
| URL | https://notebook.google.com/notebook/d3b34e36-c736-483b-89e4-0e57eb06e7dc |
| notebook_id | `d3b34e36-c736-483b-89e4-0e57eb06e7dc` |
| Cuenta | `gonzalomlopolito@gmail.com` |
| Config local | [`.notebooklm/config.json`](../.notebooklm/config.json) |

## Por qué esta stack ([skills.sh](https://www.skills.sh/))

Se evaluaron skills públicas de NotebookLM. Para Cursor, la mejor conexión es **MCP + CLI** de [`notebooklm-mcp-cli`](https://www.skills.sh/reason-machines/devtools-skills/notebooklm-mcp-programmatic-access) (`nlm` / `notebooklm-mcp`), no solo automatización por browser:

- MCP nativo en Cursor (consultas, fuentes, Studio)
- Auth por perfil aislado al proyecto
- Skill del agente instalada en `.cursor/skills/nlm-skill`

Otras opciones vistas en skills.sh (browser-only / menos MCP): `pleaseprompto/notebooklm-skill`, `sanjay3290/notebooklm-skill`. Quedan como referencia; este repo usa `notebooklm-mcp-cli`.

## Configuración en el repo

[`.cursor/mcp.json`](../.cursor/mcp.json) define el servidor **`notebooklm-nexus-edu`**:

- Binario: `notebooklm-mcp` (`uv tool install notebooklm-mcp-cli`)
- Perfil: `nexus-edu` (`NLM_PROFILE`)
- Auth/cookies en: `.cursor/notebooklm-mcp-auth/` (gitignore)
- Idioma UI: `es` (`NOTEBOOKLM_HL`)

Skill del agente: `.cursor/skills/nlm-skill` + skill de proyecto `.cursor/skills/notebooklm-nexus-edu`.

## Estado (2026-10-11)

Auth completada con `gonzalomlopolito@gmail.com`. Perfil `nexus-edu` válido. Alias CLI: `nexus-edu` → `d3b34e36-c736-483b-89e4-0e57eb06e7dc`.

En Cursor: **Settings → MCP** → habilitar **`notebooklm-nexus-edu`** y recargar la ventana si no aparece.

## Primera autenticación / re-login

```bash
export PATH="$HOME/.local/bin:$PATH"
export NOTEBOOKLM_MCP_CLI_PATH="/home/magnetico/Nexus/Nexus-Edu/.cursor/notebooklm-mcp-auth"
export NLM_PROFILE="nexus-edu"

nlm login --profile nexus-edu --storage file --clear   # o --force si expiró
nlm login --check --profile nexus-edu
nlm alias set nexus-edu d3b34e36-c736-483b-89e4-0e57eb06e7dc
```

1. Se abre el navegador → iniciá sesión con **`gonzalomlopolito@gmail.com`**.
2. Esperá a ver NotebookLM cargado.

## Uso para el agente

- Consultar docs del proyecto: `notebook_query` / `nlm notebook query` con id `d3b34e36-c736-483b-89e4-0e57eb06e7dc` (o alias `nexus-edu`).
- Sincronizar fuentes locales (README, `docs/`): `source_add` con archivos del repo; no subir PII de alumnos ni secretos.
- Este cuaderno es **exclusivo de Nexus-Edu**; no usarlo para otros repos.

## Re-autenticar

Si `nlm login --check` falla:

```bash
export NOTEBOOKLM_MCP_CLI_PATH="/home/magnetico/Nexus/Nexus-Edu/.cursor/notebooklm-mcp-auth"
nlm login --profile nexus-edu --force --clear
```

## Relación con Engram / Jira

| Herramienta | Rol |
|--|--|
| Engram | Memoria de sesiones/decisiones del agente en el repo |
| Jira EDU | Tickets y workflow AGNT |
| NotebookLM | Base documental / Q&A grounded en fuentes del cuaderno |
