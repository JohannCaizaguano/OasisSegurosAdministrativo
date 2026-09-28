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
if [ ! -s "/home/${USUARIO_DEPLOY}/.ssh/authorized_keys" ]; then
  echo "ATENCIÓN: copie la clave pública a /home/${USUARIO_DEPLOY}/.ssh/authorized_keys antes de cerrar esta sesión."
fi
chmod 600 "/home/${USUARIO_DEPLOY}/.ssh/authorized_keys" 2>/dev/null || true
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl reload ssh

echo "== 2/7 Firewall (ufw) y actualizaciones automáticas =="
apt-get update
apt-get install -y ufw fail2ban unattended-upgrades ca-certificates curl gnupg
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
echo "Copie compose.prod.yaml, compose.monitoring.yaml, infra/ y .env (chmod 600) a ${RUTA_APP}"

echo "== 5/7 Login en GHCR (como ${USUARIO_DEPLOY}) =="
echo "Ejecute:  echo <PAT> | docker login ghcr.io -u <usuario> --password-stdin"

echo "== 6/7 DNS =="
echo "Cree el registro A del dominio hacia la IP pública de este VPS. Caddy emitirá el certificado."

echo "== 7/7 Backups =="
echo "Agregue al cron de ${USUARIO_DEPLOY}:"
echo "  15 3 * * * ${RUTA_APP}/infra/scripts/backup-db.sh >> /var/log/oasis-backup.log 2>&1"

echo "Bootstrap completado."
