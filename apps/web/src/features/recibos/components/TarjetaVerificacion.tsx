import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { acortarHash } from '@/lib/format';

/** Tarjeta con el QR y el enlace a la verificación del recibo (exige sesión, ADR-015). */
export function TarjetaVerificacion({
  codigo,
  hashRecibo,
}: {
  codigo: string;
  hashRecibo: string;
}) {
  const urlVerificacion = `${window.location.origin}/recibos/verificar/${codigo}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Verificación del recibo</CardTitle>
        <CardDescription>
          Quien escanee el QR debe iniciar sesión para ver el resultado.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid justify-items-center gap-4">
        <div className="rounded-xl bg-white p-3" data-testid="qr-recibo">
          <QRCodeSVG value={urlVerificacion} size={180} title={`Verificación de ${codigo}`} />
        </div>
        <p className="break-all text-center font-mono text-xs text-[var(--muted-foreground)]">
          {urlVerificacion}
        </p>
        <Button asChild className="w-full">
          <Link to={`/recibos/verificar/${codigo}`} data-testid="enlace-verificacion">
            Abrir verificación
          </Link>
        </Button>
        <p className="text-center text-xs text-[var(--muted-foreground)]">
          Hash: {acortarHash(hashRecibo)}
        </p>
      </CardContent>
    </Card>
  );
}
