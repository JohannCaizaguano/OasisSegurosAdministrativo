// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title RegistroRecibos
/// @author Oasis Seguros
/// @notice Ancla en Polygon PoS hashes de recibos emitidos por Oasis Seguros.
/// @dev Solo se almacenan identificadores opacos (bytes32) y hashes con sal (bytes32).
///      Nunca se escribe información personal ni montos en la cadena.
///      El contrato es inmutable por diseño (sin proxy).
contract RegistroRecibos is AccessControl, Pausable {
    /// @notice Rol de la cuenta operadora del servidor, autorizada a anclar.
    bytes32 public constant REGISTRADOR_ROLE = keccak256("REGISTRADOR_ROLE");

    struct Recibo {
        bytes32 hashRecibo;
        uint64 registradoEn;
        bool anulado;
    }

    mapping(bytes32 idRecibo => Recibo recibo) private _recibos;

    error AdminInvalido();
    error IdReciboInvalido();
    error HashReciboInvalido();
    error ReciboYaRegistrado(bytes32 idRecibo);
    error ReciboNoRegistrado(bytes32 idRecibo);
    error ReciboYaAnulado(bytes32 idRecibo);

    /// @notice Emitido cuando se registra un recibo.
    /// @param idRecibo Identificador opaco del recibo.
    /// @param hashRecibo Hash anclado.
    /// @param registradoEn Marca de tiempo del registro.
    event ReciboRegistrado(bytes32 indexed idRecibo, bytes32 hashRecibo, uint64 registradoEn);

    /// @notice Emitido cuando se anula un recibo.
    /// @param idRecibo Identificador opaco del recibo.
    /// @param motivoHash Hash del motivo de la anulación.
    event ReciboAnulado(bytes32 indexed idRecibo, bytes32 motivoHash);

    /// @notice Configura la cuenta administradora del registro.
    /// @param admin Dirección que recibirá DEFAULT_ADMIN_ROLE (cuenta del despliegue,
    ///        custodiada fuera del servidor de producción).
    constructor(address admin) {
        if (admin == address(0)) {
            revert AdminInvalido();
        }
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Registra el hash de un recibo. Idempotente a nivel de protocolo: un id
    ///         ya registrado no puede volver a registrarse.
    /// @param idRecibo Identificador opaco del recibo (keccak256 del uuid interno).
    /// @param hashRecibo keccak256(sal ‖ payload canónico) calculado fuera de la cadena.
    function registrar(bytes32 idRecibo, bytes32 hashRecibo)
        external
        onlyRole(REGISTRADOR_ROLE)
        whenNotPaused
    {
        if (idRecibo == bytes32(0)) {
            revert IdReciboInvalido();
        }
        if (hashRecibo == bytes32(0)) {
            revert HashReciboInvalido();
        }
        if (_recibos[idRecibo].registradoEn != 0) {
            revert ReciboYaRegistrado(idRecibo);
        }

        uint64 registradoEn = uint64(block.timestamp);
        _recibos[idRecibo] = Recibo({hashRecibo: hashRecibo, registradoEn: registradoEn, anulado: false});

        emit ReciboRegistrado(idRecibo, hashRecibo, registradoEn);
    }

    /// @notice Marca un recibo como anulado (por ejemplo, ante una devolución).
    /// @param idRecibo Identificador del recibo a anular.
    /// @param motivoHash Hash del motivo de anulación (nunca texto en claro).
    function anular(bytes32 idRecibo, bytes32 motivoHash) external onlyRole(REGISTRADOR_ROLE) {
        Recibo storage recibo = _recibos[idRecibo];
        if (recibo.registradoEn == 0) {
            revert ReciboNoRegistrado(idRecibo);
        }
        if (recibo.anulado) {
            revert ReciboYaAnulado(idRecibo);
        }

        recibo.anulado = true;

        emit ReciboAnulado(idRecibo, motivoHash);
    }

    /// @notice Consulta pública del estado de un recibo.
    /// @param idRecibo Identificador opaco del recibo.
    /// @return existe Verdadero si el recibo fue registrado.
    /// @return hashRecibo Hash anclado.
    /// @return registradoEn Marca de tiempo (segundos) del registro.
    /// @return anulado Verdadero si el recibo fue anulado.
    function verificar(bytes32 idRecibo)
        external
        view
        returns (bool existe, bytes32 hashRecibo, uint64 registradoEn, bool anulado)
    {
        Recibo storage recibo = _recibos[idRecibo];
        return (recibo.registradoEn != 0, recibo.hashRecibo, recibo.registradoEn, recibo.anulado);
    }

    /// @notice Pausa el registro de nuevos recibos. Solo el administrador.
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Reactiva el registro de nuevos recibos. Solo el administrador.
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
