# Frontend — Baby Shower de Nohan

Invitación web del baby shower de **Nohan**. El diseño sigue la tarjeta de acuarela (oso artista, papel crema, salpicaduras azules y hojas) y los [patrones de interfaz de Vercel](https://vercel.com/design/guidelines): teclado, foco visible, formularios con etiqueta, estados de carga, confirmación al liberar un regalo, `prefers-reduced-motion` y tema claro/oscuro.

Los textos de interfaz están en **español**, **inglés** y **portugués**. El idioma se detecta con `Accept-Language` y se puede cambiar en la cabecera. El nombre **Nohan** y la dirección no se traducen.

## Paleta

Escalas 50–950 generadas en [UI Colors](https://uicolors.app/generate) a partir de los colores de la tarjeta:


| Token        | Semilla   | Uso                                    |
| ------------ | --------- | -------------------------------------- |
| `navy`       | `#1E4A7A` | Títulos, tema oscuro, acento principal |
| `watercolor` | `#5B9BD5` | Lavados azules, acento en oscuro       |
| `paper`      | `#F4EDE0` | Fondo de papel y superficies claras    |
| `sage`       | `#6B8F71` | Hojas y estados de éxito               |
| `gold`       | `#C9A44A` | Salpicaduras cálidas                   |
| `rose`       | `#C45C5C` | Errores y acciones destructivas        |


Claro: papel `#FAF7F2` y texto navy. Oscuro: navy `#13253E` y texto crema.

## Cómo funciona

1. Un solo enlace. El invitado entra su celular.
2. Elige su nombre dentro del grupo.
3. Ve los regalos de su tipo (familia o amigos) y confirma asistencia.
4. El grupo reserva **un** regalo. Si ya no está, la API responde conflicto y se muestra el error.
5. El panel en `/admin` ve asistencia y quién eligió cada regalo.

La **Cuna Cama** no aparece para invitados. En admin queda como pre-reservada.

## API

El navegador llama a `/api` en el mismo host. Next.js reenvía esas peticiones a `NEXT_PUBLIC_API_URL` (en local, `http://localhost:3000/api`).

Este frontend corre en el **puerto 5173**.

## Requisitos

- Node.js 20+
- Backend NestJS en marcha

## Instalación

```bash
npm install
cp .env.example .env
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173). Desde otro dispositivo usa `http://192.168.1.36:5173` (ese host está en `allowedDevOrigins`).


| Ruta         | Uso                                 |
| ------------ | ----------------------------------- |
| `/`          | Invitación pública                  |
| `/en`, `/pt` | Mismos flujos en inglés o portugués |
| `/admin`     | Panel del anfitrión                 |




## Música

La canción es **Índigo** de Camilo y Evaluna Montaner. Está en `public/audio/song.mp3`. El reproductor no arranca solo: hay que pulsar play.

## Créditos

En la esquina inferior derecha aparece **Diseño: Rubén Gómez**.

## Scripts


| Comando         | Descripción                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Desarrollo en el puerto 5173 |
| `npm run build` | Compilación de producción    |
| `npm start`     | Servidor de producción       |




## Despliegue (Vercel)

1. Sube este repositorio a Vercel.
2. Define `NEXT_PUBLIC_API_URL` con la URL pública del backend (`https://tu-api.onrender.com/api`).
3. En el backend, agrega la URL de Vercel a `FRONTEND_URL` (puede ir junto a localhost, separada por coma).



## Panel admin

Desde la invitación, **Anfitrión** (arriba a la derecha) abre el inicio de sesión.

Las credenciales viven en el seed del backend (`ADMIN_EMAIL` y `ADMIN_PASSWORD`). No las commits en el frontend.

Después de entrar verás quién rechazó, quién confirmó y quién reservó cada regalo. En **Invitados** puedes añadir, editar o eliminar personas y grupos (incluidos grupos vacíos, para asignar gente después).