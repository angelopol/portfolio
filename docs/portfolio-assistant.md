# Asistente y perfil de GitHub

El portafolio muestra el README de `angelopol/angelopol` en el panel de GitHub. El administrador puede cambiar usuario, repositorio o visibilidad desde Configuración. El servidor consulta la API de GitHub con una caché de 15 minutos. El HTML del README se sanitiza y los enlaces e imágenes relativos se resuelven respecto al repositorio. Las estadísticas dependen de los servicios de imágenes usados en el README. Si GitHub falla, se muestra un enlace al repositorio.

La conexión es de lectura: las modificaciones del README se realizan en GitHub. `GITHUB_TOKEN` es opcional y solo se utiliza en el servidor para ampliar la cuota de consultas.

El chat público responde preguntas con el contenido guardado del portafolio y el README como contexto. El asistente privado en `/control-room/assistant` también puede proponer ediciones de textos, parámetros, proyectos, experiencias, educación, certificaciones, traducciones y configuración de GitHub.

Configura `AI_AGENT_API_KEY` y, opcionalmente, `AI_AGENT_MODEL` usando la conexión existente con Gemini. La clave permanece en el servidor. Se envían al proveedor el contenido del portafolio, el README y los últimos mensajes; en el panel se incluye el borrador actual. Los mensajes del chat permanecen en memoria durante la sesión del componente y no se almacenan en la base de datos.

Las propuestas se validan contra la estructura del portafolio, incluyendo tipos, identificadores y enlaces. El usuario puede revisar los campos y valores y aplicar o descartar cada propuesta. Al aplicar, los cambios pasan al editor y al guardado automático habitual (Supabase o JSON local). Si el borrador cambió mientras se generaba la propuesta, se exige solicitar una nueva para no sobrescribir las ediciones. Las visitas públicas no pueden proponer cambios aunque envíen `mode: admin` manualmente: se valida la sesión en el servidor.

La API limita consultas por minuto en cada instancia y aplica un timeout al proveedor. Este contador en memoria no es una cuota global entre instancias; para un despliegue con varias instancias, configura una cuota compartida o límites de tráfico en el hosting. No hay llamadas de IA durante el build.

Validación local:

```sh
npm run test:assistant
npm run build
```

Fuentes de las integraciones: [GitHub README API](https://docs.github.com/en/rest/repos/contents#get-a-repository-readme) y [Gemini generateContent](https://ai.google.dev/api/generate-content).
