export function validateOrgStep1Required(form: any) {
  const v = form?.state?.values?.organizacion || {}
  const r = v?.representante || {}
  const p = r?.persona || {}

  const anyEmpty =
    !v.nombre ||
    !v.numeroVoluntarios ||
    !v.cedulaJuridica ||
    !v.tipoOrganizacion ||
    !v.direccion ||
    !v.telefono ||
    !v.email ||
    !r.cargo ||
    !p.cedula ||
    !p.nombre ||
    !p.apellido1 ||
    !p.apellido2 ||
    !p.telefono ||
    !p.email

  const namesToValidate = [
    "organizacion.nombre",
    "organizacion.numeroVoluntarios",
    "organizacion.cedulaJuridica",
    "organizacion.tipoOrganizacion",
    "organizacion.direccion",
    "organizacion.telefono",
    "organizacion.email",
    "organizacion.representante.cargo",
    "organizacion.representante.persona.cedula",
    "organizacion.representante.persona.nombre",
    "organizacion.representante.persona.apellido1",
    "organizacion.representante.persona.apellido2",
    "organizacion.representante.persona.telefono",
    "organizacion.representante.persona.email",
  ]

  namesToValidate.forEach((n) => form?.validateField?.(n, "submit"))

  return { anyEmpty }
}