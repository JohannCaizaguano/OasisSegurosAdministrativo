import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { acortarHash } from '@/lib/format';

/** Tarjeta con el QR y el enlace a la verificación pública del recibo. */
export function TarjetaVerificacionPublica({
  codigo,
  hashRecibo,
}: {
  codigo: string;
  hashRecibo: string;
}) {
  const urlPublica = `${window.location.origin}/verificar/${codigo}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Verificación pública</CardTitle>
        <CardDescription>
          Cualquier persona puede comprobar este recibo sin iniciar sesión.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid justify-items-center gap-4">
        <div className="rounded-xl bg-white p-3" data-testid="qr-recibo">
          <QRCodeSVG value={urlPublica} size={180} title={`Verificación de ${codigo}`} />
        </div>
        <p className="break-all text-center font-mono text-xs text-[var(--muted-foreground)]">
          {urlPublica}
        </p>
        <Button asChild className="w-full">
          <Link to={`/verificar/${codigo}`} data-testid="enlace-verificacion">
            Abrir verificación pública
          </Link>
        </Button>
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          Hash: {acortarHash(hashRecibo)}
        </p>
      </CardContent>
    </Card>
  );
}
