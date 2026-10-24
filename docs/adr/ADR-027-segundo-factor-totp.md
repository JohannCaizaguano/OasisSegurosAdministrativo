# ADR-027 · Segundo factor TOTP para el administrador

- **Estado**: aceptado
- **Fecha**: 2026-10
- **Sprint**: S8

## Contexto

HU-52 exige que el ADMIN inicie sesión con un código TOTP compatible con las aplicaciones
autenticadoras, con códigos de recuperación de un solo uso guardados con argon2, y que se respete el
límite de intentos. El ADMIN puede crear usuarios, cambiar roles, anular recibos y anonimizar
titulares: una contraseña filtrada no debe bastar.

## Decisión

- **Secreto cifrado** con AES-256-GCM y la llave `TOTP_ENC_KEY` del entorno del API; se guarda junto
  con la fecha de activación. Los 10 códigos de recuperación se guardan con argon2id y se muestran
  una sola vez.
- **Alta en dos pasos:** iniciar (secreto y URI `otpauth://` con emisor «Oasis Seguros», QR generado
  en el servidor) y activar con un código válido (ventana de ±1 paso).
- **Login en dos pasos:** con la contraseña correcta, el ADMIN con TOTP recibe un desafío (JWT de
  5 min, sin sesión) y la sesión se crea al verificar el código o un código de recuperación; 5
  intentos por 15 min, con los contadores en Redis.
- **Obligatorio:** un ADMIN sin TOTP queda restringido a activarlo antes de operar.
- **Avisos:** activar, desactivar o regenerar códigos envía un correo al usuario (ADR-023).

## Alternativas descartadas

- **WebAuthn o llaves de seguridad:** más fuertes, pero el backlog pide TOTP y el personal ya usa
  aplicaciones autenticadoras.
- **Segundo factor opcional:** dejaría una ventana en la que un ADMIN opera solo con contraseña.
- **Códigos por correo o SMS:** canales más débiles que el TOTP y dependientes de terceros.

## Consecuencias

- Positivas: una contraseña filtrada del ADMIN no da acceso.
- Negativas: perder `TOTP_ENC_KEY` obliga a todos los ADMIN a regenerar su segundo factor; un ADMIN
  que pierde el teléfono y los códigos necesita que otro ADMIN le restablezca el factor.
