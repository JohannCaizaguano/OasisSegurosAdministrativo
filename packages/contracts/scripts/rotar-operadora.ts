import { rotarOperadora } from './administracion.ts';
import { conectar, direccion, leerArgumentos } from './argumentos.ts';

// Uso: pnpm --filter @oasis/contracts rotar-operadora --red amoyAdmin --contrato 0x… --anterior 0x… --nueva 0x… [--pausar]
// Firma la billetera fría (ADMIN_FRIA_PRIVATE_KEY en el keystore del equipo del autor).
const args = leerArgumentos({
  contrato: { type: 'string' },
  anterior: { type: 'string' },
  nueva: { type: 'string' },
  pausar: { type: 'boolean' },
});
const { publicClient, firmante, registro } = await conectar(
  String(args.red),
  direccion(args.contrato, 'contrato'),
);

const { transacciones } = await rotarOperadora({
  registro,
  publicClient,
  admin: firmante.account,
  anterior: direccion(args.anterior, 'anterior'),
  nueva: direccion(args.nueva, 'nueva'),
  pausar: args.pausar === true,
});
console.log(`Rotación lista: ${transacciones.length} transacciones.`);
if (args.pausar === true) {
  console.log(
    'El registro quedó pausado: actualice OPERATOR_PRIVATE_KEY del worker y reanude con unpause.',
  );
}
