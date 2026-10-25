import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RamoEtiqueta } from './RamoEtiqueta';

describe('RamoEtiqueta', () => {
  it('pinta el ícono del código conocido y el nombre del ramo', () => {
    const { container } = render(<RamoEtiqueta codigo="VEHICULOS" nombre="Vehículos" />);
    expect(screen.getByText('Vehículos')).toBeInTheDocument();
    expect(container.querySelector('[data-ramo="VEHICULOS"]')).not.toBeNull();
  });

  it('pinta el ícono genérico con un código desconocido', () => {
    const { container } = render(<RamoEtiqueta codigo="NUEVO" nombre="Nuevo ramo" />);
    expect(screen.getByText('Nuevo ramo')).toBeInTheDocument();
    expect(container.querySelector('[data-ramo="GENERICO"]')).not.toBeNull();
  });

  it('oculta el ícono a los lectores de pantalla', () => {
    const { container } = render(<RamoEtiqueta codigo="VIDA" nombre="Vida" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
