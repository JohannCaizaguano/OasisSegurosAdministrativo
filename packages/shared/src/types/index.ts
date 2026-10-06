/** Tipos de dominio compartidos entre API y SPA (alias de los esquemas Zod). */

// --- Entidades y modelos de lectura ------------------------------------------
export type { Aseguradora } from '../schemas/aseguradora.schema';
export type { Cliente } from '../schemas/cliente.schema';
export type { Pago } from '../schemas/pago.schema';
export type { Poliza } from '../schemas/poliza.schema';
export type { ReciboDetalle, ReciboResumen } from '../schemas/recibo.schema';
export type { VerificacionRecibo } from '../schemas/recibo.schema';
export type { ApiError, PaginacionMeta, RespuestaPaginada } from '../schemas/common.schema';

// --- Cuerpos de entrada de los endpoints -------------------------------------
export type {
  ActualizarAseguradoraInput,
  CrearAseguradoraInput,
} from '../schemas/aseguradora.schema';
export type { ActualizarClienteInput, CrearClienteInput } from '../schemas/cliente.schema';
export type { ActualizarPolizaInput, CrearPolizaInput } from '../schemas/poliza.schema';
export type { CrearPagoInput, RechazarPagoInput, ValidarPagoInput } from '../schemas/pago.schema';
export type { LoginInput, LoginResponse, UsuarioSesion } from '../schemas/auth.schema';
export type { CambiarContrasenaInput } from '../schemas/auth.schema';

// --- Consultas de listado ----------------------------------------------------
export type { ListarAseguradorasQuery } from '../schemas/aseguradora.schema';
export type { ListarClientesQuery } from '../schemas/cliente.schema';
export type { ListarPagosQuery } from '../schemas/pago.schema';
export type { ListarPolizasQuery } from '../schemas/poliza.schema';
export type { ListarRecibosQuery } from '../schemas/recibo.schema';
export type { PaginacionQuery } from '../schemas/common.schema';

// --- Uniones de literales del dominio ----------------------------------------
export type {
  EstadoPago,
  EstadoPoliza,
  EstadoRecibo,
  EstadoVerificacion,
  MetodoPago,
  TipoIdentificacion,
} from '../constants/estados';
export type { Rol } from '../constants/roles';
