# Actualizar Nexus-Edu en Windows (sin perder la base)

Guía para docentes y para quien publica versiones. Relacionado: [EDU-22](https://nexus-educacion.atlassian.net/browse/EDU-22).

## Dónde está la base de datos

La SQLite **no** está dentro de la carpeta del programa. Vive en datos de usuario:

`%APPDATA%\nexus-edu\data\nexus-edu.sqlite`

Actualizar (menú o instalador nuevo) **reemplaza solo los archivos de la app**. Esa ruta no se borra.

Antes de cualquier update importante: sidebar → **Respaldar base**.

## Probar el botón Actualizar (recomendado)

La **1.0.0** no tenía updater. Para probar el flujo completo:

1. Cerrar Nexus-Edu.
2. Descargar e instalar a mano la beta:  
   [`nexus-edu-1.1.0-beta.1-setup.exe`](https://github.com/GyGSol/Nexus-Edu/releases/download/v1.1.0-beta.1/nexus-edu-1.1.0-beta.1-setup.exe)  
   (Release **prerelease** — no es “Latest”). Para Drive: subir ese archivo y compartir el link.
3. Abrir la app: verificar que alumnos/notas siguen (BD en `%APPDATA%`).
4. Sidebar → **Actualizar app**.
5. Debe ofrecer bajar la estable **1.1.0**, descargar, reiniciar.
6. Tras reinicio, versión **1.1.0** y datos intactos.

Si SmartScreen avisa: *Más información* → *Ejecutar de todas formas*.

## Uso habitual (ya en 1.1.0+)

1. Abrir Nexus-Edu (instalador NSIS, no el portable suelto).
2. Sidebar → **Actualizar app**.
3. Si hay versión nueva: descarga → reinicia sola.
4. Si ya está al día: mensaje “Ya tenés la última versión…”.

Requisitos: Internet; repo [GyGSol/Nexus-Edu](https://github.com/GyGSol/Nexus-Edu) **público** (para leer `latest.yml` sin token en la app).

## Instalar solo la estable (sin probar el salto beta→stable)

1. Cerrar Nexus-Edu.
2. Descargar `nexus-edu-1.1.0-setup.exe` desde [Latest](https://github.com/GyGSol/Nexus-Edu/releases/latest).
3. Instalar encima → abrir y verificar datos.

## Publicar una nueva versión (desarrollo)

1. Subir `version` en `package.json` (semver).
   - Estable: `1.2.0` → Release + `latest.yml`
   - Beta de prueba: `1.2.0-beta.1` → prerelease + `beta.yml` (no pisa Latest)
2. Commit + push a `main`.
3. Tag: `git tag v1.2.0 && git push origin v1.2.0` (o `v1.2.0-beta.1`).
4. GitHub Actions (`.github/workflows/release-windows.yml`) publica setup / portable / yml.
5. En PC: instalar beta a mano para probar, o **Actualizar app** desde una versión anterior.

Publicación local (opcional, `GH_TOKEN` con `repo`):

```bash
export GH_TOKEN=ghp_...
pnpm release:win
```

## Qué no hacer

- No borrar `%APPDATA%\nexus-edu` al actualizar.
- No cambiar el `appId` (`com.nexus.edu`) sin migrar datos.
- Preferir instalador NSIS; el portable no es el canal principal de auto-update.
