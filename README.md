# OpenCareClock

OpenCareClock es una aplicación web abierta (open source) pensada para mostrar un reloj y calendario claros, con notas y recordatorios diarios, orientada a personas mayores o con dificultades de memoria, y a sus cuidadores.

## Objetivos

- Reducir la carga cognitiva mostrando la información esencial (hora, fecha y momento del día) de forma grande y legible.
- Facilitar rutinas diarias mediante notas y recordatorios sencillos.
- Ser muy compatible con tabletas antiguas (por ejemplo, iPad 2 con iOS 9) y funcionar sin conexión a internet.

## Funcionalidades

- Reloj y fecha en texto grande, con “Momento del día” (mañana, tarde, noche).
- Notas del día: crea, muestra y borra notas según los días de la semana que elijas.
- Recordatorios: programa avisos por hora y días (con sonido y alerta visual).
- Modo kiosko: interfaz simplificada a pantalla completa, pensada para uso diario.
- Temas accesibles: oscuro, claro y alto contraste.
- Tamaño ajustable: distintos niveles de escala para mejorar la legibilidad.
- Exportar/Importar: copia de seguridad de la configuración en un archivo JSON.
- Funcionamiento sin conexión: todos los datos se guardan localmente en el navegador (LocalStorage); no se envían datos a servidores externos.

## Compatibilidad y simplicidad técnica

- Hecho con HTML, CSS y JavaScript “vanilla”, priorizando la compatibilidad con navegadores antiguos (incluido Safari en iOS 9).
- Pensado para funcionar en tabletas como iPad 2 (1024x768, 132 ppi).
- No requiere instalación de Node ni dependencias de build.

## Uso en iPad (iOS 9) en modo pantalla completa

1. Abre la app en Safari.
2. Toca “Compartir” → “Añadir a pantalla de inicio”.
3. Abre desde el icono creado; se mostrará sin la barra de direcciones.
4. Activa/desactiva el modo kiosko desde el botón “Kiosko” (arriba).

Para salir del modo kiosko: mantén pulsado 2–3 segundos el pie de página (o realiza triple toque sobre la hora) e ingresa PIN si está configurado.

## Demo pública

Puedes probar la aplicación funcionando en:

- https://dmunozfer.github.io/opencareclock/

La app funciona sin conexión a internet y almacena todo en local en el navegador.

## Privacidad

- No se recopila ni se envía información a servidores.
- Todos los datos (notas, recordatorios y ajustes) permanecen en el dispositivo del usuario.

## Licencia

- Código: MIT License. Puedes usarlo, modificarlo y distribuirlo con atribución.
- Recursos (ej. iconos, tipografías o audio de aviso): mantener sus licencias originales si aplican.

## Contribuciones

¡Las contribuciones son bienvenidas! Abre un issue o un pull request con mejoras, correcciones de compatibilidad o nuevas opciones de accesibilidad.
