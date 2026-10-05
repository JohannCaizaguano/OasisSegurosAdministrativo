-- RN-17: la bitácora de auditoría es de solo inserción.
CREATE FUNCTION bitacora_solo_insercion() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'La bitácora de auditoría es de solo inserción (RN-17)';
END;
$$;

CREATE TRIGGER bitacora_sin_update_delete
  BEFORE UPDATE OR DELETE ON "BitacoraAuditoria"
  FOR EACH ROW EXECUTE FUNCTION bitacora_solo_insercion();

CREATE TRIGGER bitacora_sin_truncate
  BEFORE TRUNCATE ON "BitacoraAuditoria"
  FOR EACH STATEMENT EXECUTE FUNCTION bitacora_solo_insercion();
