import { useRef, useState } from "react"
import { organizacionSchema } from "../schemas/volunteerSchema"
import { validateSolicitudVoluntariado } from "../services/volunteerFormService"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomSelect } from "@/shared/ui/CustomSelect"

interface OrganizacionSectionProps {
  form: any
  showErrors?: boolean
}

const TIPOS_ORGANIZACION = [
  "ONG",
  "Institución educativa",
  "Empresa privada",
  "Grupo comunitario",
  "Otro",
]

function validateOrgField(key: keyof typeof organizacionSchema.shape) {
  const shape = (organizacionSchema.shape as any)[key]
  if (!shape) return () => undefined

  return (arg: any) => {
    const value = arg && typeof arg === "object" && "value" in arg ? arg.value : arg
    const single = shape.safeParse(value)
    return single.success ? undefined : single.error.issues?.[0]?.message || "Campo inválido"
  }
}

export function OrganizacionSection({ form, showErrors }: OrganizacionSectionProps) {
  const [tipoOrg, setTipoOrg] = useState(
    (form.getFieldValue?.("organizacion.tipoOrganizacion") as string) || ""
  )
  const [otroTipo, setOtroTipo] = useState("")

 const [verificandoCJ, setVerificandoCJ] = useState(false)
  const [cjError, setCjError] = useState<string>("")

  const inputBase =
    "border-[#DCD6C9] focus-visible:ring-[#708C3E]/30 focus-visible:ring-2 focus-visible:ring-offset-0"
  const inputError =
    "border-[#9c1414] focus-visible:ring-[#9c1414]/30 focus-visible:ring-2 focus-visible:ring-offset-0"

const cjDebounceRef = useRef<number | null>(null)
const lastCheckedCjRef = useRef<string>("")

  return (
    <div className="bg-white rounded-xl shadow-md border border-[#DCD6C9]">
      <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center space-x-2">
        <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center text-white font-bold text-sm">
          1
        </div>
        <h3 className="text-lg font-semibold text-[#708C3E]">Información de la Organización</h3> 
        <p className="mt-1 text-xs text-gray-500">(Todos los campos son obligatorios a menos que contengan la etiqueta "Opcional") </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Cédula jurídica */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula jurídica</label>

          <form.Field
            name="organizacion.cedulaJuridica"
            validators={{
              onBlur: validateOrgField("cedulaJuridica"),
              onChange: validateOrgField("cedulaJuridica"),
              onSubmit: validateOrgField("cedulaJuridica"),
            }}
          >
            {(field: any) => {
              const zodErr = showErrors && field.state.meta.errors?.length > 0
              const hasErr = !!cjError || !!zodErr

              const precheckCJ = async (cjRaw: string) => {
                const cj = (cjRaw ?? "").trim()
                const localMsg = validateOrgField("cedulaJuridica")(cj)
                if (localMsg) return

                if (lastCheckedCjRef.current === cj) return

                setVerificandoCJ(true)
                try {
                  await validateSolicitudVoluntariado({
                    tipoSolicitante: "ORGANIZACION",
                    cedulaJuridica: cj,
                  })

                  lastCheckedCjRef.current = cj
                  setCjError("")
                } catch (err: any) {
                  const status = err?.response?.status
                  const msg =
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "No se pudo validar la cédula jurídica. Intenta de nuevo."

                  lastCheckedCjRef.current = cj

                  if (status === 409) {
                    setCjError(msg)
                    return
                  }

                  // otros errores
                  setCjError("No se pudo validar la cédula jurídica. Intenta de nuevo.")
                } finally {
                  setVerificandoCJ(false)
                }
              }

              return (
                <>
                  <Input
                    type="text"
                    value={field.state.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value

                      field.handleChange(value)
                      field.handleBlur?.()
                      if (cjError) setCjError("") // limpia error al escribir

                      const trimmed = value.trim()

                      if (trimmed.length >= 3) {
                        if (cjDebounceRef.current) window.clearTimeout(cjDebounceRef.current)
                        cjDebounceRef.current = window.setTimeout(() => {
                          precheckCJ(trimmed)
                        }, 350)
                      } else {
                        lastCheckedCjRef.current = ""
                      }
                    }}
                    onBlur={async (e) => {
                      field.handleBlur()

                      const v = e.target.value.trim()
                      if (v.length >= 9) {
                        if (cjDebounceRef.current) window.clearTimeout(cjDebounceRef.current)
                        await precheckCJ(v)
                      }
                    }}
                    aria-invalid={hasErr}
                    className={`${hasErr ? inputError : inputBase} pr-10 bg-white`}
                    maxLength={20}
                  />

                  {verificandoCJ && (
                    <div className="absolute right-3 top-[34px]">
                      <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"
                        />
                      </svg>
                    </div>
                  )}

                  {/* primero error de zod */}
                  {zodErr && <p className="text-sm text-[#9c1414] mt-1">{field.state.meta.errors[0]}</p>}

                  {/* luego error del backend */}
                  {cjError && <p className="text-sm text-[#9c1414] mt-1">{cjError}</p>}
                  <p className="mt-1 text-xs text-gray-500">Ejemplo: 502120987-980</p>
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
            validators={{
              onBlur: validateOrgField("nombre"),
              onChange: validateOrgField("nombre"),
              onSubmit: validateOrgField("nombre"),
            }}
          >
            {(field: any) => (
              <>
                <Input
                  type="text"
                  value={field.state.value ?? ""}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    field.handleBlur?.()
                  }}
                  onBlur={field.handleBlur}
                  aria-invalid={!!(showErrors && field.state.meta.errors?.length > 0)}
                  className={`${showErrors && field.state.meta.errors?.length > 0 ? inputError : inputBase} bg-white`}
                  maxLength={100}
                />
                {showErrors && field.state.meta.errors?.length > 0 && (
                  <p className="text-sm text-[#9c1414] mt-1">{field.state.meta.errors[0]}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Ejemplo: Fundación Amigos del Ambiente</p>
              </>
            )}
          </form.Field>
        </div>

        {/* Número de voluntarios */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número estimado de voluntarios
          </label>

          <form.Field
            name="organizacion.numeroVoluntarios"
            validators={{
              onBlur: validateOrgField("numeroVoluntarios"),
              onChange: validateOrgField("numeroVoluntarios"),
              onSubmit: validateOrgField("numeroVoluntarios"),
            }}
          >
            {(field: any) => (
              <>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  value={field.state.value ?? ""}
                  onChange={(e) =>
                     {
                      field.handleChange(
                        Number.isNaN(parseInt(e.target.value, 10))
                          ? undefined
                          : parseInt(e.target.value, 10)
                      )
                      field.handleBlur?.()
                    }
                  }
                  onBlur={field.handleBlur}
                  aria-invalid={!!(showErrors && field.state.meta.errors?.length > 0)}
                  className={`${showErrors && field.state.meta.errors?.length > 0 ? inputError : inputBase} bg-white`}
                />
                {showErrors && field.state.meta.errors?.length > 0 && (
                  <p className="text-sm text-[#9c1414] mt-1">{field.state.meta.errors[0]}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Mínimo 1 voluntario, máximo 15 voluntarios</p>
              </>
            )}
          </form.Field>
        </div>

        {/* Tipo de organización */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de organización</label>

          <form.Field
            name="organizacion.tipoOrganizacion"
            validators={{
              onBlur: validateOrgField("tipoOrganizacion"),
              onChange: validateOrgField("tipoOrganizacion"),
              onSubmit: validateOrgField("tipoOrganizacion"),
            }}
          >
            {(field: any) => {
              const hasError = !!(showErrors && field.state.meta.errors?.length > 0)

              const options = [
                { value: "", label: "Seleccione..." },
                ...TIPOS_ORGANIZACION.map((t) => ({ value: t, label: t })),
              ]

              return (
                <>
                  <CustomSelect
                    value={(field.state.value ?? "") as string}
                    options={options}
                    zIndex={50}
                    onChange={(val) => {
                      const valor = String(val || "")
                      setTipoOrg(valor)

                      if (valor !== "Otro") {
                        setOtroTipo("")
                        field.handleChange(valor)
                        field.handleBlur?.()
                      } else {
                        field.handleChange("")
                        field.handleBlur?.()
                      }
                    }}
                  />

                  {/* truco para blur */}
                  <div tabIndex={0} onFocus={() => field.handleBlur()} className="sr-only" />
                  {hasError && (
                    <p className="text-sm text-[#9c1414] mt-1">{field.state.meta.errors[0]}</p>
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
                          field.handleBlur?.()
                        }}
                        maxLength={100}
                        className={`${inputBase} bg-white`}
                      />
                      <p className="mt-1 text-xs text-gray-500">Ejemplo: Cooperativa agrícola</p>
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
            validators={{
              onBlur: validateOrgField("direccion"),
              onChange: validateOrgField("direccion"),
              onSubmit: validateOrgField("direccion"),
            }}
          >
            {(field: any) => (
              <>
                <Textarea
                  value={field.state.value ?? ""}
                   onChange={(e) => {
                    field.handleChange(e.target.value)
                    field.handleBlur?.()
                  }}
                  onBlur={field.handleBlur}
                  rows={3}
                  maxLength={255}
                  aria-invalid={!!(showErrors && field.state.meta.errors?.length > 0)}
                  className={`${showErrors && field.state.meta.errors?.length > 0 ? inputError : inputBase} bg-white resize-none`}
                />

                {showErrors && field.state.meta.errors?.length > 0 && (
                  <p className="text-sm text-[#9c1414] mt-1">{field.state.meta.errors[0]}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Ejemplo: Provincia, Cantón, Distrito. Señas extra.</p>
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
            validators={{
              onBlur: validateOrgField("telefono"),
              onChange: validateOrgField("telefono"),
              onSubmit: validateOrgField("telefono"),
            }}
          >
            {(field: any) => (
              <>
                <Input
                  type="tel"
                  value={field.state.value ?? ""}
                  onChange={(e) => {
                    field.handleChange(e.target.value)
                    field.handleBlur?.()
                  }}
                  onBlur={field.handleBlur}
                  min={8}
                  maxLength={15}
                  aria-invalid={!!(showErrors && field.state.meta.errors?.length > 0)}
                  className={`${showErrors && field.state.meta.errors?.length > 0 ? inputError : inputBase} bg-white`}
                />
                {showErrors && field.state.meta.errors?.length > 0 && (
                  <p className="text-sm text-[#9c1414] mt-1">{field.state.meta.errors[0]}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Ejemplo: +506 2222-2222</p>
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
            validators={{
              onBlur: validateOrgField("email"),
              onChange: validateOrgField("email"),
              onSubmit: validateOrgField("email"),
            }}
          >
            {(field: any) => {
              const zodErr = showErrors && field.state.meta.errors?.length > 0
              const hasErr = !!zodErr

              return (
                <>
                  <Input
                    type="email"
                    maxLength={80}
                    value={field.state.value ?? ""}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      field.handleBlur?.()

                    }}
                    onBlur={field.handleBlur}
                    aria-invalid={hasErr}
                    className={`${hasErr ? inputError : inputBase} pr-10 bg-white`}
                  />
                  {zodErr && <p className="text-sm text-[#9c1414] mt-1">{field.state.meta.errors[0]}</p>}
                  <p className="mt-1 text-xs text-gray-500">Ejemplo: contacto@dominio.email</p>
                </>
              )
            }}
          </form.Field>
        </div>
      </div>
    </div>
  )
}  