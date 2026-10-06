// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {RegistroRecibos} from "../contracts/RegistroRecibos.sol";

contract RegistroRecibosTest is Test {
    RegistroRecibos internal registro;
    address internal admin = address(0xA11CE);
    address internal registrador = address(0xB0B);
    address internal intruso = address(0xBAD);

    bytes32 internal constant ID_RECIBO = keccak256("recibo-1");
    bytes32 internal constant HASH_RECIBO = keccak256("hash-recibo-1");
    bytes32 internal constant MOTIVO = keccak256("motivo-anulacion");

    event ReciboRegistrado(bytes32 indexed idRecibo, bytes32 hashRecibo, uint64 registradoEn);
    event ReciboAnulado(bytes32 indexed idRecibo, bytes32 motivoHash);

    function setUp() public {
        registro = new RegistroRecibos(admin);
        bytes32 rolRegistrador = registro.REGISTRADOR_ROLE();
        vm.prank(admin);
        registro.grantRole(rolRegistrador, registrador);
    }

    function test_Constructor_OtorgaAdmin() public view {
        assertTrue(registro.hasRole(registro.DEFAULT_ADMIN_ROLE(), admin));
        assertFalse(registro.hasRole(registro.REGISTRADOR_ROLE(), admin));
    }

    function test_Constructor_Revert_AdminCero() public {
        vm.expectRevert(RegistroRecibos.AdminInvalido.selector);
        new RegistroRecibos(address(0));
    }

    function test_Registrar_Exitoso() public {
        vm.warp(1_700_000_000);
        vm.expectEmit(true, false, false, true, address(registro));
        emit ReciboRegistrado(ID_RECIBO, HASH_RECIBO, uint64(1_700_000_000));

        vm.prank(registrador);
        registro.registrar(ID_RECIBO, HASH_RECIBO);

        (bool existe, bytes32 hashRecibo, uint64 registradoEn, bool anulado) =
            registro.verificar(ID_RECIBO);
        assertTrue(existe);
        assertEq(hashRecibo, HASH_RECIBO);
        assertEq(registradoEn, uint64(1_700_000_000));
        assertFalse(anulado);
    }

    function test_Registrar_Revert_SinRol() public {
        bytes32 rolRegistrador = registro.REGISTRADOR_ROLE();
        vm.prank(intruso);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, intruso, rolRegistrador
            )
        );
        registro.registrar(ID_RECIBO, HASH_RECIBO);
    }

    function test_Registrar_Revert_IdCero() public {
        vm.prank(registrador);
        vm.expectRevert(RegistroRecibos.IdReciboInvalido.selector);
        registro.registrar(bytes32(0), HASH_RECIBO);
    }

    function test_Registrar_Revert_HashCero() public {
        vm.prank(registrador);
        vm.expectRevert(RegistroRecibos.HashReciboInvalido.selector);
        registro.registrar(ID_RECIBO, bytes32(0));
    }

    function test_Registrar_Revert_Duplicado() public {
        vm.prank(registrador);
        registro.registrar(ID_RECIBO, HASH_RECIBO);

        vm.prank(registrador);
        vm.expectRevert(
            abi.encodeWithSelector(RegistroRecibos.ReciboYaRegistrado.selector, ID_RECIBO)
        );
        registro.registrar(ID_RECIBO, keccak256("otro-hash"));
    }

    function testFuzz_Registrar(bytes32 idRecibo, bytes32 hashRecibo, uint64 timestamp) public {
        vm.assume(idRecibo != bytes32(0));
        vm.assume(hashRecibo != bytes32(0));
        vm.assume(timestamp > 0);
        vm.warp(timestamp);

        vm.prank(registrador);
        registro.registrar(idRecibo, hashRecibo);

        (bool existe, bytes32 hashAlmacenado, uint64 registradoEn, bool anulado) =
            registro.verificar(idRecibo);
        assertTrue(existe);
        assertEq(hashAlmacenado, hashRecibo);
        assertEq(registradoEn, timestamp);
        assertFalse(anulado);
    }

    function test_Anular_Exitoso() public {
        vm.prank(registrador);
        registro.registrar(ID_RECIBO, HASH_RECIBO);

        vm.expectEmit(true, false, false, true, address(registro));
        emit ReciboAnulado(ID_RECIBO, MOTIVO);

        vm.prank(registrador);
        registro.anular(ID_RECIBO, MOTIVO);

        (bool existe, bytes32 hashRecibo,, bool anulado) = registro.verificar(ID_RECIBO);
        assertTrue(existe);
        assertEq(hashRecibo, HASH_RECIBO);
        assertTrue(anulado);
    }

    function test_Anular_Revert_NoRegistrado() public {
        vm.prank(registrador);
        vm.expectRevert(
            abi.encodeWithSelector(RegistroRecibos.ReciboNoRegistrado.selector, ID_RECIBO)
        );
        registro.anular(ID_RECIBO, MOTIVO);
    }

    function test_Anular_Revert_YaAnulado() public {
        vm.prank(registrador);
        registro.registrar(ID_RECIBO, HASH_RECIBO);
        vm.prank(registrador);
        registro.anular(ID_RECIBO, MOTIVO);

        vm.prank(registrador);
        vm.expectRevert(abi.encodeWithSelector(RegistroRecibos.ReciboYaAnulado.selector, ID_RECIBO));
        registro.anular(ID_RECIBO, MOTIVO);
    }

    function test_Anular_Revert_SinRol() public {
        vm.prank(registrador);
        registro.registrar(ID_RECIBO, HASH_RECIBO);

        bytes32 rolRegistrador = registro.REGISTRADOR_ROLE();
        vm.prank(intruso);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, intruso, rolRegistrador
            )
        );
        registro.anular(ID_RECIBO, MOTIVO);
    }

    /// La pausa solo detiene registros nuevos (arquitectura §5.4): anular sigue disponible.
    function test_Anular_PermitidoMientrasPausado() public {
        vm.prank(registrador);
        registro.registrar(ID_RECIBO, HASH_RECIBO);

        vm.prank(admin);
        registro.pause();

        vm.prank(registrador);
        registro.anular(ID_RECIBO, MOTIVO);

        (bool existe,,, bool anulado) = registro.verificar(ID_RECIBO);
        assertTrue(existe);
        assertTrue(anulado);
    }

    function test_Pause_Revert_RegistrarMientrasPausado() public {
        vm.prank(admin);
        registro.pause();

        vm.prank(registrador);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        registro.registrar(ID_RECIBO, HASH_RECIBO);
    }

    function test_Unpause_PermiteRegistrar() public {
        vm.prank(admin);
        registro.pause();
        vm.prank(admin);
        registro.unpause();

        vm.prank(registrador);
        registro.registrar(ID_RECIBO, HASH_RECIBO);

        (bool existe,,, bool anulado) = registro.verificar(ID_RECIBO);
        assertTrue(existe);
        assertFalse(anulado);
    }

    function test_Unpause_Revert_SinAdmin() public {
        vm.prank(admin);
        registro.pause();

        bytes32 rolAdmin = registro.DEFAULT_ADMIN_ROLE();
        vm.prank(registrador);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, registrador, rolAdmin
            )
        );
        registro.unpause();
    }

    function test_Pause_Revert_SinAdmin() public {
        bytes32 rolAdmin = registro.DEFAULT_ADMIN_ROLE();
        vm.prank(registrador);
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, registrador, rolAdmin
            )
        );
        registro.pause();
    }

    function test_Verificar_NoRegistrado() public view {
        (bool existe, bytes32 hashRecibo, uint64 registradoEn, bool anulado) =
            registro.verificar(ID_RECIBO);
        assertFalse(existe);
        assertEq(hashRecibo, bytes32(0));
        assertEq(registradoEn, 0);
        assertFalse(anulado);
    }
}
