import { useMemo, useState } from "react"
import { volunteerOrganizacionSchema } from "../schemas/volunteerSchema"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { CustomSelect } from "@/shared/ui/CustomSelect"
import { existsEmail } from "../services/volunteerFormService"

export function OrganizacionSection({
  form,
  showErrors = false,
}: {
  form: any
  showErrors?: boolean
}) {
  const orgSchema = useMemo(() => volunteerOrganizacionSchema.shape.organizacion, [])

  const [tipoOrg, setTipoOrg] = useState("")
  const [otroTipo, setOtroTipo] = useState("")
  const [emailDupError, setEmailDupError] = useState("")
  const [verificandoEmail, setVerificandoEmail] = useState(false)
  const TIPOS_ORGANIZACION = [
    "Asociación",
    "Fundación",
    "Cooperativa",
    "Empresa",
    "Institución pública",
    "ONG",
    "Centro educativo",
    "Otro",
  ]
  const validateOrgField =
    (key: keyof typeof orgSchema.shape) => (arg: any) => {
      const schema = (orgSchema.shape as any)[key]
      if (!schema) return undefined

      const value = arg && typeof arg === "object" && "value" in arg ? arg.value : arg
      const result = schema.safeParse(value)
      return result.success
        ? undefined
        : result.error.issues?.[0]?.message || "Campo inválido"
    }

  const shouldShowFieldError = (field: any) => {
    const hasError =
      Array.isArray(field.state.meta.errors) && field.state.meta.errors.length > 0
    const isTouched = !!field.state.meta.isTouched
    return hasError && (showErrors || isTouched)
  }

  const fieldErrorMsg = (field: any) => {
    const e = field?.state?.meta?.errors?.[0]
    return e ? String(e) : ""
  }

  const inputBase =
    "border-[#DCD6C9] focus-visible:ring-[#708C3E]/30 focus-visible:ring-2 focus-visible:ring-offset-0"

  const inputError =
    "border-[#9c1414] focus-visible:ring-[#9c1414]/30 focus-visible:ring-2 focus-visible:ring-offset-0"

  const commonValidators = (key: keyof typeof orgSchema.shape) => ({
    onBlur: validateOrgField(key),
    onChange: validateOrgField(key),
    onSubmit: validateOrgField(key),
  })

  return (
    <div className="bg-white rounded-xl shadow-md border border-[#DCD6C9]">
      <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center space-x-2">
        <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center text-white font-bold text-sm">
          1
        </div>
        <h3 className="text-lg font-semibold text-[#708C3E]">
          Información de la Organización
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {/* Cédula jurídica */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cédula jurídica
          </label>

          <form.Field
            name="organizacion.cedulaJuridica"
            validators={commonValidators("cedulaJuridica")}
          >
            {(field: any) => {
              const hasError = shouldShowFieldError(field)

              return (
                <>
                  <Input
                    type="text"
                    value={field.state.value ?? ""}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/\D/g, "")
                      field.handleChange(onlyNumbers)
                    }}
                    onBlur={field.handleBlur}
                    maxLength={10}
                    aria-invalid={hasError}
                    className={`${hasError ? inputError : inputBase} bg-white`}
                  />

                  {hasError && (
                    <p className="text-sm text-[#9c1414] mt-1">
                      {fieldErrorMsg(field)}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-gray-500">
                    Ejemplo: 3101123456
                  </p>
                </>
              )
            }}
          </form.Field>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la organización
          </label>

          <form.Field
            name="organizacion.nombre"
            validators={commonValidators("nombre")}
          >
            {(field: any) => (
              <>
                <Input
                  type="text"
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  maxLength={150}
                  aria-invalid={shouldShowFieldError(field)}
                  className={`${shouldShowFieldError(field) ? inputError : inputBase} bg-white`}
                />

                {shouldShowFieldError(field) && (
                  <p className="text-sm text-[#9c1414] mt-1">{fieldErrorMsg(field)}</p>
                )}
              </>
            )}
          </form.Field>
        </div>

        {/* Número de voluntarios */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de voluntarios
          </label>

          <form.Field
            name="organizacion.numeroVoluntarios"
            validators={commonValidators("numeroVoluntarios")}
          >
            {(field: any) => (
              <>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                    field.handleChange(
                      Number.isNaN(parseInt(e.target.value, 10))
                        ? undefined
                        : parseInt(e.target.value, 10)
                    )
                  }
                  onBlur={field.handleBlur}
                  placeholder="Mínimo 1"
                  aria-invalid={shouldShowFieldError(field)}
                  className={`${shouldShowFieldError(field) ? inputError : inputBase} bg-white`}
                />

                {shouldShowFieldError(field) && (
                  <p className="text-sm text-[#9c1414] mt-1">{fieldErrorMsg(field)}</p>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  Mínimo 1 voluntario, máximo 15 voluntarios
                </p>
              </>
            )}
          </form.Field>
        </div>

        {/* Tipo de organización */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de organización
          </label>

          <form.Field
            name="organizacion.tipoOrganizacion"
            validators={commonValidators("tipoOrganizacion")}
          >
            {(field: any) => {
              const hasError = shouldShowFieldError(field)

              const options = [
                { value: "", label: "Seleccione..." },
                ...TIPOS_ORGANIZACION.map((t) => ({ value: t, label: t })),
              ]

              return (
                <>
                  <CustomSelect
                    value={(field.state.value ?? "") as string}
                    options={options}
                    placeholder="Seleccione un tipo o agregue uno nuevo"
                    zIndex={50}
                    onChange={(val) => {
                      const valor = String(val || "")
                      setTipoOrg(valor)

                      if (valor !== "Otro") {
                        setOtroTipo("")
                        field.handleChange(valor)
                      } else {
                        field.handleChange("")
                      }
                    }}
                  />

                  <div tabIndex={0} onFocus={() => field.handleBlur()} className="sr-only" />

                  {hasError && (
                    <p className="text-sm text-[#9c1414] mt-1">{fieldErrorMsg(field)}</p>
                  )}

                  {tipoOrg === "Otro" && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Especifique el tipo de organización
                      </label>

                      <Input
                        type="text"
                        value={otroTipo}
                        onChange={(e) => {
                          const v = e.target.value
                          setOtroTipo(v)
                          field.handleChange(v)
                        }}
                        onBlur={field.handleBlur}
                        maxLength={100}
                        className={`${hasError ? inputError : inputBase} bg-white`}
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        Ejemplo: Cooperativa agrícola
                      </p>
                    </div>
                  )}
                </>
              )
            }}
          </form.Field>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección de la organización
          </label>

          <form.Field
            name="organizacion.direccion"
            validators={commonValidators("direccion")}
          >
            {(field: any) => (
              <>
                <Textarea
                  value={field.state.value ?? ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={3}
                  maxLength={255}
                  aria-invalid={shouldShowFieldError(field)}
                  className={`${shouldShowFieldError(field) ? inputError : inputBase} bg-white resize-none`}
                />

                {shouldShowFieldError(field) && (
                  <p className="text-sm text-[#9c1414] mt-1">{fieldErrorMsg(field)}</p>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  Ejemplo: Provincia, Cantón, Distrito. Señas extra.
                </p>
              </>
            )}
          </form.Field>
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono de la organización
          </label>

          <form.Field
            name="organizacion.telefono"
            validators={commonValidators("telefono")}
          >
            {(field: any) => (
              <>
                <Input
                  type="tel"
                  value={field.state.value ?? ""}
                  onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, "")
                    field.handleChange(onlyNumbers)
                  }}
                  onBlur={field.handleBlur}
                  maxLength={8}
                  aria-invalid={shouldShowFieldError(field)}
                  className={`${shouldShowFieldError(field) ? inputError : inputBase} bg-white`}
                />

                {shouldShowFieldError(field) && (
                  <p className="text-sm text-[#9c1414] mt-1">{fieldErrorMsg(field)}</p>
                )}

                <p className="mt-1 text-xs text-gray-500">Ejemplo: 22222222</p>
              </>
            )}
          </form.Field>
        </div>

        {/* Email institucional */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico institucional
          </label>

          <form.Field
            name="organizacion.email"
            validators={commonValidators("email")}
          >
            {(field: any) => {
              const zodErr = shouldShowFieldError(field)
              const hasErr = !!emailDupError || zodErr

              return (
                <>
                  <Input
                    type="email"
                    maxLength={80}
                    value={field.state.value ?? ""}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      if (emailDupError) setEmailDupError("")
                    }}
                    onBlur={async (e) => {
                      field.handleBlur()

                      const email = e.target.value.trim()
                      if (!email) return

                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                      if (!emailRegex.test(email)) return

                      setVerificandoEmail(true)
                      try {
                        const existe = await existsEmail(email)
                        setEmailDupError(
                          existe ? "Este email ya está registrado en el sistema" : ""
                        )
                      } finally {
                        setVerificandoEmail(false)
                      }
                    }}
                    aria-invalid={hasErr}
                    className={`${hasErr ? inputError : inputBase} bg-white pr-10`}
                  />

                  {verificandoEmail && (
                    <div className="absolute right-3 top-[34px]">
                      <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12h4a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
                        />
                      </svg>
                    </div>
                  )}

                  {!!emailDupError && (
                    <p className="text-sm text-[#9c1414] mt-1">{emailDupError}</p>
                  )}

                  {!emailDupError && zodErr && (
                    <p className="text-sm text-[#9c1414] mt-1">{fieldErrorMsg(field)}</p>
                  )}

                  <p className="mt-1 text-xs text-gray-500">
                    Ejemplo: contacto@dominio.email
                  </p>
                </>
              )
            }}
          </form.Field>
        </div>
      </div>
    </div>
  )
}