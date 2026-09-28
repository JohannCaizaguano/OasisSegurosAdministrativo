#!/usr/bin/env bash
# Aprovisiona un VPS Ubuntu 24.04 (OVHcloud VPS-1) para Oasis Seguros.
# Ejecutar como root la primera vez:  bash bootstrap-vps.sh
set -euo pipefail

USUARIO_DEPLOY="${USUARIO_DEPLOY:-deploy}"
RUTA_APP="/opt/oasis"

echo "== 1/7 Usuario ${USUARIO_DEPLOY}, claves SSH y hardening =="
if ! id "${USUARIO_DEPLOY}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${USUARIO_DEPLOY}"
  usermod -aG sudo "${USUARIO_DEPLOY}"
fi
install -d -m 700 -o "${USUARIO_DEPLOY}" -g "${USUARIO_DEPLOY}" "/home/${USUARIO_DEPLOY}/.ssh"

# Desactivar el login por contraseña sin una clave verificada deja al operador
# fuera del servidor y exige entrar por la consola del proveedor. Se aborta.
if [ ! -s "/home/${USUARIO_DEPLOY}/.ssh/authorized_keys" ]; then
  cat <<AVISO >&2

ERROR: /home/${USUARIO_DEPLOY}/.ssh/authorized_keys está vacío.

Copie su clave pública antes de continuar:
  ssh-copy-id -i ~/.ssh/id_ed25519.pub ${USUARIO_DEPLOY}@<IP_DEL_VPS>
o, desde otra sesión ya abierta como root:
  echo '<CLAVE_PUBLICA>' > /home/${USUARIO_DEPLOY}/.ssh/authorized_keys

Verifique que puede entrar con:
  ssh ${USUARIO_DEPLOY}@<IP_DEL_VPS> 'echo ok'

Vuelva a ejecutar este script cuando el acceso por clave funcione.

AVISO
  exit 1
fi
chown "${USUARIO_DEPLOY}:${USUARIO_DEPLOY}" "/home/${USUARIO_DEPLOY}/.ssh/authorized_keys"
chmod 600 "/home/${USUARIO_DEPLOY}/.ssh/authorized_keys"
# Ubuntu 24.04 y las imágenes de OVHcloud incluyen `Include
# /etc/ssh/sshd_config.d/*.conf` al principio de sshd_config, y sshd usa el
# PRIMER valor obtenido. Editar sshd_config a mano deja de tener efecto
# porque el drop-in de cloud-init gana: se escribe un drop-in propio con
# prioridad 99.
cat > /etc/ssh/sshd_config.d/99-oasis.conf <<'SSHD'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
SSHD
chmod 644 /etc/ssh/sshd_config.d/99-oasis.conf
sshd -t
systemctl reload ssh

echo "== 2/7 Firewall (ufw) y actualizaciones automáticas =="
apt-get update
apt-get install -y ufw fail2ban unattended-upgrades ca-certificates curl gnupg
# `dpkg-reconfigure` no habilita las actualizaciones automáticas: hay que
# escribir la configuración de los periodos de APT.
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'APT'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
APT
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "== 3/7 Docker Engine + compose plugin =="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
usermod -aG docker "${USUARIO_DEPLOY}"

echo "== 4/7 Directorio de la aplicación =="
install -d -m 750 -o "${USUARIO_DEPLOY}" -g "${USUARIO_DEPLOY}" "${RUTA_APP}"
echo "Copie compose.prod.yaml, compose.monitoring.yaml e infra/ a ${RUTA_APP}"
# .env y .env.worker contienen secretos: se crean vacíos con permisos 600 desde el
# principio para que un archivo recién creado no quede legible por otros usuarios.
install -m 600 /dev/null "${RUTA_APP}/.env"
install -m 600 /dev/null "${RUTA_APP}/.env.worker"
chown "${USUARIO_DEPLOY}:${USUARIO_DEPLOY}" "${RUTA_APP}/.env" "${RUTA_APP}/.env.worker"
echo "  ${RUTA_APP}/.env        -> config comun (NO debe incluir OPERATOR_PRIVATE_KEY)"
echo "  ${RUTA_APP}/.env.worker -> solo OPERATOR_PRIVATE_KEY (lo inyecta el worker)"

echo "== 5/7 Login en GHCR (como ${USUARIO_DEPLOY}) =="
echo "Ejecute:  echo <PAT> | docker login ghcr.io -u <usuario> --password-stdin"

echo "== 6/7 DNS =="
echo "Cree el registro A del dominio hacia la IP pública de este VPS. Caddy emitirá el certificado."

echo "== 7/7 Backups =="
echo "Agregue al cron de ${USUARIO_DEPLOY}:"
echo "  15 3 * * * ${RUTA_APP}/infra/scripts/backup-db.sh >> /var/log/oasis-backup.log 2>&1"

echo "Bootstrap completado."
