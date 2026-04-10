import type { VolunteersFormData } from "../../../volunteersInformation/models/VolunteersType"
import { UserRound, Mail } from "lucide-react"
import { NavigationButtons } from "../../components/NavigationButtons"
import { useState } from "react"
import { volunteerOrganizacionSchema } from "../../schemas/volunteerSchema"
import { validateSolicitudVoluntariado } from "../../services/volunteerFormService"
import { Input } from "@/components/ui/input"
import { BirthDatePicker } from "@/components/ui/birthDatePicker"
import { useCedulaLookupController } from "@/shared/hooks/useCedulaLookupController" // <-- ponelo donde lo guardés

interface StepPersonalInformationProps {
  formData: VolunteersFormData
  handleInputChange: (field: keyof VolunteersFormData, value: string | boolean) => void
  onNextCombined: () => void
  isStepValid: () => boolean
  lookup: (id: string) => Promise<any>
}

export function StepPersonalInformation({
  formData,
  handleInputChange,
  onNextCombined,
  isStepValid,
  lookup,
}: StepPersonalInformationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [limitReached, setLimitReached] = useState<Record<string, boolean>>({})

  const personaSchema = volunteerOrganizacionSchema.shape.organizacion.shape.representante.shape.persona

  const updateLimitFlag = (field: keyof VolunteersFormData, value: string, maxLen?: number) => {
    if (!maxLen) return
    setLimitReached((prev) => ({ ...prev, [field as string]: value.length >= maxLen }))
  }

  const validateField = (field: keyof VolunteersFormData, value: any) => {
    const mapped = mapFormToPersona({ ...formData, [field]: value })
    const single = personaSchema.pick({ [mapField(field)]: true } as any)
    const key = mapField(field)
    const result = single.safeParse({ [key]: (mapped as Record<string, any>)[key] })
    setErrors((prev) => ({ ...prev, [field]: result.success ? "" : result.error.issues[0]?.message || "" }))
  }

  const validateAll = () => {
    const persona = mapFormToPersona(formData)
    const result = personaSchema.safeParse(persona)
    if (!result.success) {
      const newErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = reverseMapField(issue.path[0] as string)
        if (field) newErrors[field] = issue.message
      })
      setErrors(newErrors)
      return false
    }
    setErrors({})
    return true
  }

  // ✅ RESET: cuando cambia la cédula, limpiamos datos de persona anterior
  const resetPersonaFields = () => {
    const clear = (f: keyof VolunteersFormData) => handleInputChange(f, "")

    clear("name")
    clear("lastName1")
    clear("lastName2")
    clear("phone")
    clear("email")
    clear("birthDate")
    clear("address")
    handleInputChange("nacionalidad" as any, "")

    // limpiamos errores relacionados (si querés, podés dejar idNumber intacto)
    setErrors((prev) => ({
      ...prev,
      name: "",
      lastName1: "",
      lastName2: "",
      phone: "",
      email: "",
      birthDate: "",
      address: "",
      nacionalidad: "",
    }))
  }

  // ✅ FILL: mapea el lookup a tus fields
  const fillFromLookup = (result: any) => {
    const nameVal = result.firstname || ""
    const last1Val = result.lastname1 || ""
    const last2Val = result.lastname2 || ""

    handleInputChange("name", nameVal)
    handleInputChange("lastName1", last1Val)
    handleInputChange("lastName2", last2Val)

    validateField("name", nameVal)
    validateField("lastName1", last1Val)
    validateField("lastName2", last2Val)

    updateLimitFlag("name", nameVal, 60)
    updateLimitFlag("lastName1", last1Val, 60)
    updateLimitFlag("lastName2", last2Val, 60)

    if (result.source === "DB") {
      const vi = result.volunteerIndividual ?? {}

      const setIfDefined = (field: keyof VolunteersFormData, val: any, max?: number) => {
        if (val === undefined || val === null) return
        const v = String(val)
        handleInputChange(field, v)
        validateField(field, v)
        if (max) updateLimitFlag(field, v, max)
      }

      setIfDefined("phone", vi.phone, 20)
      setIfDefined("email", vi.email, 60)
      setIfDefined("birthDate", vi.birthDate)
      setIfDefined("address", vi.address, 200)
      // nacionalidad si existe en DB:
      // setIfDefined("nacionalidad" as any, vi.nacionalidad, 40)
    }
  }

  // ✅ Hook reusable
  const cedulaCtrl = useCedulaLookupController({
    minLen: 9,
    debounceMs: 350,
    lookup,
    isFromDB: (res) => res?.source === "DB",
    onReset: resetPersonaFields,
    onFill: fillFromLookup,
    precheck: async (digits) => {
      // PRECHECK: pendiente / ya activo
      await validateSolicitudVoluntariado({
        tipoSolicitante: "INDIVIDUAL",
        cedula: digits,
      })
    },
  })

  // ✅ si el precheck devolvió error tipo 409, lo mostramos en idNumber y NO seguimos llenando
  const precheckError = cedulaCtrl.error
  const verificandoCedula = cedulaCtrl.loading
  const personaFromDB = cedulaCtrl.fromDB

  // Si querés “meter” el error en idNumber para UI (como antes):
  // (esto es opcional; también podés leer directamente cedulaCtrl.error)
  const idNumberError = errors.idNumber || precheckError

  const inputBase =
    "border-[#DCD6C9] focus-visible:ring-[#708C3E]/30 focus-visible:ring-2 focus-visible:ring-offset-0"
  const inputError =
    "border-[#9c1414] focus-visible:ring-[#9c1414]/30 focus-visible:ring-2 focus-visible:ring-offset-0"

  // ✅ BLOQUEOS (igual patrón que querías)
  const bloquearPorCedula = verificandoCedula || !!idNumberError
  const bloquearNombreApellidos = bloquearPorCedula
  const bloquearCamposDB = bloquearPorCedula || personaFromDB

  const disabledBase = "bg-[#ECECEC] opacity-70 cursor-not-allowed"

  const handleNext = async () => {
    const ok = validateAll() && isStepValid()
    if (!ok) return

    // si hay error en cédula, no avanzar
    if (idNumberError) return

    onNextCombined()
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md border border-[#DCD6C9]">
        <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center">
            <UserRound className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[#708C3E]">Información Personal</h3>
          <p className="mt-1 text-xs text-gray-500">
            (Todos los campos son obligatorios a menos que contengan la etiqueta "Opcional")
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Cédula */}
            <div className="relative">
              <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Cédula/ Número de pasaporte
              </label>

              <Input
                id="idNumber"
                type="text"
                value={formData.idNumber}
                onChange={(e) => {
                  const value = e.target.value
                  handleInputChange("idNumber", value)
                  validateField("idNumber", value)
                  updateLimitFlag("idNumber", value, 50)

                  // limpiamos error local + el del hook
                  setErrors((prev) => ({ ...prev, idNumber: "" }))
                  cedulaCtrl.setError("")

                  // ✅ aquí está lo importante:
                  // al cambiar, el hook resetea campos si cambió la cédula (para no mezclar personas)
                  cedulaCtrl.onKeyChange(value)
                }}
                onBlur={async (e) => {
                  const ced = e.target.value.trim()
                  await cedulaCtrl.onKeyBlur(ced)
                }}
                required
                maxLength={50}
                className={`${idNumberError ? inputError : inputBase} pr-10 bg-white`}
              />

              {verificandoCedula && (
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

              {!!idNumberError && <p className="text-sm text-[#9c1414] mt-1">{idNumberError}</p>}
              {limitReached["idNumber"] && (
                <p className="text-sm text-orange-600 mt-1">Has alcanzado el límite de 50 caracteres.</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Ejemplo: 504550789</p>
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="nameId" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>

              <Input
                id="nameId"
                type="text"
                value={formData.name}
                disabled={bloquearNombreApellidos}
                onChange={(e) => {
                  if (bloquearNombreApellidos) return
                  handleInputChange("name", e.target.value)
                  validateField("name", e.target.value)
                  updateLimitFlag("name", e.target.value, 60)
                }}
                required
                maxLength={50}
                className={`${errors.name ? inputError : inputBase} ${
                  bloquearNombreApellidos ? disabledBase : "bg-[#ECECEC]"
                }`}
              />

              {errors.name && <p className="text-sm text-[#9c1414] mt-1">{errors.name}</p>}
              {limitReached["name"] && (
                <p className="text-sm text-orange-600 mt-1">Has alcanzado el límite de 50 caracteres.</p>
              )}
              {personaFromDB ? (
                <p className="mt-1 text-xs text-gray-500">Este dato fue recuperado del sistema y no puede modificarse.</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Tu nombre</p>
              )}
            </div>
          </div>

          {/* Apellidos */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primer Apellido</label>

              <Input
                type="text"
                value={formData.lastName1}
                disabled={bloquearNombreApellidos}
                onChange={(e) => {
                  if (bloquearNombreApellidos) return
                  handleInputChange("lastName1", e.target.value)
                  validateField("lastName1", e.target.value)
                  updateLimitFlag("lastName1", e.target.value, 40)
                }}
                required
                maxLength={40}
                className={`${errors.lastName1 ? inputError : inputBase} ${
                  bloquearNombreApellidos ? disabledBase : "bg-[#ECECEC]"
                }`}
              />

              {errors.lastName1 && <p className="text-sm text-[#9c1414] mt-1">{errors.lastName1}</p>}
              {limitReached["lastName1"] && (
                <p className="text-sm text-orange-600 mt-1">Has alcanzado el límite de 40 caracteres.</p>
              )}
              {personaFromDB ? (
                <p className="mt-1 text-xs text-gray-500">Este dato fue recuperado del sistema y no puede modificarse.</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Tu primer apellido</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segundo Apellido</label>

              <Input
                type="text"
                value={formData.lastName2}
                disabled={bloquearNombreApellidos}
                onChange={(e) => {
                  if (bloquearNombreApellidos) return
                  handleInputChange("lastName2", e.target.value)
                  validateField("lastName2", e.target.value)
                  updateLimitFlag("lastName2", e.target.value, 60)
                }}
                required
                maxLength={40}
                className={`${errors.lastName2 ? inputError : inputBase} ${
                  bloquearNombreApellidos ? disabledBase : "bg-[#ECECEC]"
                }`}
              />

              {errors.lastName2 && <p className="text-sm text-[#9c1414] mt-1">{errors.lastName2}</p>}
              {limitReached["lastName2"] && (
                <p className="text-sm text-orange-600 mt-1">Has alcanzado el límite de 40 caracteres.</p>
              )}
              {personaFromDB ? (
                <p className="mt-1 text-xs text-gray-500">Este dato fue recuperado del sistema y no puede modificarse.</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Tu segundo apellido</p>
              )}
            </div>
          </div>

          {/* Fecha de nacimiento */}
          <div className={bloquearCamposDB ? "pointer-events-none opacity-70" : ""}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>

            <BirthDatePicker
              value={formData.birthDate}
              onChange={(iso) => {
                if (bloquearCamposDB) return
                handleInputChange("birthDate", iso)
                validateField("birthDate", iso)
              }}
              minAge={16}
              placeholder="Seleccione una fecha"
              error={errors.birthDate}
            />

            {personaFromDB ? (
              <p className="mt-1 text-xs text-gray-500">Este dato fue recuperado del sistema y no puede modificarse.</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">Debe ser mayor a 16 años.</p>
            )}
          </div>

          {/* Nacionalidad */}
          <div>
            <label htmlFor="nacionalidad" className="block text-sm font-medium text-gray-700 mb-1">
              Nacionalidad (Opcional)
            </label>

            <Input
              id="nacionalidad"
              type="text"
              value={formData.nacionalidad || ""}
              disabled={bloquearCamposDB}
              onChange={(e) => {
                if (bloquearCamposDB) return
                handleInputChange("nacionalidad" as any, e.target.value)
                validateField("nacionalidad" as any, e.target.value)
                updateLimitFlag("nacionalidad" as any, e.target.value, 40)
              }}
              maxLength={40}
              className={`${errors.nacionalidad ? inputError : inputBase} ${bloquearCamposDB ? disabledBase : "bg-white"}`}
            />

            {errors.nacionalidad && <p className="text-sm text-[#9c1414] mt-1">{errors.nacionalidad}</p>}
            {personaFromDB ? (
              <p className="mt-1 text-xs text-gray-500">Este dato fue recuperado del sistema y no puede modificarse.</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">Tu nacionalidad. Ejemplo: Costarricense</p>
            )}
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="bg-white rounded-xl shadow-md border border-[#DCD6C9]">
        <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[#708C3E]">Información de Contacto</h3>
          <p className="mt-1 text-xs text-gray-500">
            (Todos los campos son obligatorios a menos que contengan la etiqueta "Opcional")
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#4A4A4A] mb-1">
                Teléfono
              </label>

              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                disabled={bloquearCamposDB}
                onChange={(e) => {
                  if (bloquearCamposDB) return
                  handleInputChange("phone", e.target.value)
                  validateField("phone", e.target.value)
                  updateLimitFlag("phone", e.target.value, 20)
                }}
                required
                minLength={8}
                maxLength={20}
                className={`${errors.phone ? inputError : inputBase} ${bloquearCamposDB ? disabledBase : "bg-white"}`}
              />

              {errors.phone && <p className="text-sm text-[#9c1414] mt-1">{errors.phone}</p>}
              {personaFromDB ? (
                <p className="mt-1 text-xs text-gray-500">Este dato fue recuperado del sistema y no puede modificarse.</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Ejemplo: +506 2222-2222</p>
              )}
            </div>

            {/* Email */}
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-medium text-[#4A4A4A] mb-1">
                Email
              </label>

              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled={bloquearCamposDB}
                onChange={(e) => {
                  if (bloquearCamposDB) return
                  handleInputChange("email", e.target.value)
                  validateField("email", e.target.value)
                  updateLimitFlag("email", e.target.value, 60)
                  setErrors((prev) => ({ ...prev, email: "" }))

                }}
                required
                maxLength={60}
                className={`${errors.email ? inputError : inputBase} pr-10 ${bloquearCamposDB ? disabledBase : "bg-white"}`}
              />

              {errors.email && <p className="text-sm text-[#9c1414] mt-1">{errors.email}</p>}
              {limitReached["email"] && (
                <p className="text-sm text-orange-600 mt-1">Has alcanzado el límite de 60 caracteres.</p>
              )}

              {personaFromDB ? (
                <p className="mt-1 text-xs text-gray-500">Este dato fue recuperado del sistema y no puede modificarse.</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">Ejemplo: contacto@dominio.email</p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-[#4A4A4A] mb-1">
              Dirección Completa (Opcional)
            </label>

            <Input
              id="address"
              type="text"
              value={formData.address}
              disabled={bloquearCamposDB}
              onChange={(e) => {
                if (bloquearCamposDB) return
                handleInputChange("address", e.target.value)
                validateField("address", e.target.value)
                updateLimitFlag("address", e.target.value, 200)
              }}
              maxLength={255}
              className={`${errors.address ? inputError : inputBase} ${bloquearCamposDB ? disabledBase : "bg-white"}`}
            />

            {errors.address && <p className="text-sm text-[#9c1414] mt-1">{errors.address}</p>}
            {personaFromDB ? (
              <p className="mt-1 text-xs text-gray-500">Este dato fue recuperado del sistema y no puede modificarse.</p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">Ejemplo: Provincia, Cantón, Distrito. Señas extra.</p>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <NavigationButtons showPrev={false} onNext={handleNext} disableNext={!isStepValid()} />
      </div>
    </div>
  )
}

function mapFormToPersona(data: VolunteersFormData) {
  return {
    cedula: data.idNumber,
    nombre: data.name,
    apellido1: data.lastName1,
    apellido2: data.lastName2,
    telefono: data.phone,
    email: data.email,
    fechaNacimiento: data.birthDate,
    direccion: data.address || "",
    nacionalidad: data.nacionalidad || "",
  }
}

function mapField(field: keyof VolunteersFormData): string {
  const map: Record<string, string> = {
    idNumber: "cedula",
    name: "nombre",
    lastName1: "apellido1",
    lastName2: "apellido2",
    phone: "telefono",
    email: "email",
    birthDate: "fechaNacimiento",
    address: "direccion",
    nacionalidad: "nacionalidad",
  }
  return map[field] || (field as string)
}

function reverseMapField(field: string): keyof VolunteersFormData | null {
  const reverse: Record<string, keyof VolunteersFormData> = {
    cedula: "idNumber",
    nombre: "name",
    apellido1: "lastName1",
    apellido2: "lastName2",
    telefono: "phone",
    email: "email",
    fechaNacimiento: "birthDate",
    direccion: "address",
    nacionalidad: "nacionalidad" as any,
  }
  return reverse[field] || null
}