import { Calendar as CalendarIcon, Target, Heart } from "lucide-react"
import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react"
import { z } from "zod"
import { volunteerOrganizacionSchema } from "../schemas/volunteerSchema"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { es } from "date-fns/locale"

interface DisponibilidadAreasProps {
  form?: any
  formData?: any
  handleInputChange?: (field: string, value: any) => void
  tipoSolicitante: "INDIVIDUAL" | "ORGANIZACION"
}

const AREAS_OPCIONES = [
  "Eventos y actividades",
  "Educación ambiental",
  "Apoyo administrativo",
  "Comunicación y redes sociales",
  "Trabajo de campo/fincas",
  "Capacitación y talleres",
  "Mejora y mantenimiento de Infraestructura",
]

export type DisponibilidadAreasSectionHandle = {
  validateAndShowErrors: () => boolean
  isValid: () => boolean
  clearErrors: () => void
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const DisponibilidadAreasSection = forwardRef<
  DisponibilidadAreasSectionHandle,
  DisponibilidadAreasProps
>(function DisponibilidadAreasSection(
  { form, formData, handleInputChange, tipoSolicitante }: DisponibilidadAreasProps,
  ref
) {
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([])
  const [horariosSeleccionados, setHorariosSeleccionados] = useState<string[]>([])
  const [areasSeleccionadas, setAreasSeleccionadas] = useState<string[]>([])
  const [razonSocial, setRazonSocial] = useState("")
  const [otraArea, setOtraArea] = useState("")

  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  const horarios = [
    { label: "Mañana (8:00 AM - 12:00 PM)", value: "mañana" },
    { label: "Tarde (1:00 PM - 4:30 PM)", value: "tarde" },
    { label: "Flexible", value: "flexible" },
  ]
  const todayDate = useMemo(() => startOfDay(new Date()), [])

  const [errors, setErrors] = useState<{
    fechaInicio?: string
    fechaFin?: string
    dias?: string
    horarios?: string
    areasInteres?: string
    otraArea?: string
    razonSocial?: string
  }>({})

  const [showErrors, setShowErrors] = useState(false)

  const orgShape = volunteerOrganizacionSchema.shape.organizacion.shape

  const disponibilidadArraySchema =
    (orgShape.disponibilidades as z.ZodOptional<any>).unwrap?.() ?? orgShape.disponibilidades
  const disponibilidadItemSchema: z.ZodTypeAny = (disponibilidadArraySchema as z.ZodArray<any>).element

  const areasInteresArraySchema =
    (orgShape.areasInteres as z.ZodOptional<any>).unwrap?.() ?? orgShape.areasInteres

  const razonesSocialesArraySchema =
    (orgShape.razonesSociales as z.ZodOptional<any>)?.unwrap?.() ?? orgShape.razonesSociales

  const otraAreaSchema = useMemo(
    () =>
      z
        .string()
        .trim()
        .min(3, 'Especifique el área (mínimo 3 caracteres)')
        .max(60, 'Máximo 60 caracteres'),
    []
  )

  const buildDisponibilidadPayload = () => ({
    fechaInicio,
    fechaFin,
    dias: diasSeleccionados,
    horarios: horariosSeleccionados,
  })

  const buildAreasPayload = () =>
    areasSeleccionadas.map((area) => ({
      nombreArea: (area === "Otro" ? otraArea : area).trim(),
    }))

  const getDisponibilidadErrors = (payload: {
    fechaInicio: string
    fechaFin: string
    dias: string[]
    horarios: string[]
  }) => {
    const res = disponibilidadItemSchema.safeParse(payload)
    const base = { fechaInicio: "", fechaFin: "", dias: "", horarios: "" }

    if (!res.success) {
      for (const issue of res.error.issues) {
        const key = (issue.path[0] as string) || ""
        if (key === "fechaInicio") base.fechaInicio = issue.message
        if (key === "fechaFin") base.fechaFin = issue.message
        if (key === "dias") base.dias = issue.message
        if (key === "horarios") base.horarios = issue.message
      }
    }
    return base
  }

  const getAreasErrors = (list: { nombreArea: string }[]) => {
    const res = (areasInteresArraySchema as z.ZodArray<any>).safeParse(list)

    let otraAreaErr = ""
    if (areasSeleccionadas.includes("Otro")) {
      const r = otraAreaSchema.safeParse(otraArea)
      otraAreaErr = r.success ? "" : r.error.issues?.[0]?.message || "Especifique el área"
    }

    return {
      areasInteres: res.success
        ? ""
        : res.error.issues[0]?.message || "Seleccione al menos un área de interés",
      otraArea: otraAreaErr,
    }
  }

  const getRazonSocialErrors = (value: string) => {
    if (tipoSolicitante !== "ORGANIZACION") return { razonSocial: "" }

    const res = (razonesSocialesArraySchema as z.ZodArray<any>).safeParse([
      { razonSocial: String(value ?? "").trim() },
    ])

    return {
      razonSocial: res.success
        ? ""
        : res.error.issues?.[0]?.message || "La razón social es requerida",
    }
  }

  const isEmptyErrors = (e: typeof errors) =>
    !e.fechaInicio &&
    !e.fechaFin &&
    !e.dias &&
    !e.horarios &&
    !e.areasInteres &&
    !e.otraArea &&
    !e.razonSocial

  useImperativeHandle(ref, () => ({
    validateAndShowErrors: () => {
      const disp = buildDisponibilidadPayload()
      const areasPayload = buildAreasPayload()

      const e1 = getDisponibilidadErrors(disp)
      const e2 = getAreasErrors(areasPayload)
      const e3 = getRazonSocialErrors(razonSocial)

      const merged = { ...e1, ...e2, ...e3 }
      setErrors(merged)
      setShowErrors(true)
      return isEmptyErrors(merged)
    },
    isValid: () => {
      const disp = buildDisponibilidadPayload()
      const areasPayload = buildAreasPayload()
      const merged = {
        ...getDisponibilidadErrors(disp),
        ...getAreasErrors(areasPayload),
        ...getRazonSocialErrors(razonSocial),
      }
      return isEmptyErrors(merged)
    },
    clearErrors: () => {
      setShowErrors(false)
      setErrors({})
    },
  }))

  const formRef = useRef(form)
  const handleRef = useRef(handleInputChange)
  const hydratedKeyRef = useRef("")
  const readyToSyncRef = useRef(false)

  useEffect(() => {
    formRef.current = form
  }, [form])
  useEffect(() => {
    handleRef.current = handleInputChange
  }, [handleInputChange])

  useEffect(() => {
    const orgValues = form?.state?.values?.organizacion
    const srcDisponibilidad =
      tipoSolicitante === "ORGANIZACION"
        ? orgValues?.disponibilidades?.[0]
        : formData?.disponibilidades?.[0]
    const srcAreas =
      tipoSolicitante === "ORGANIZACION"
        ? orgValues?.areasInteres ?? []
        : formData?.areasInteres ?? []
    const srcRazonSocial =
      tipoSolicitante === "ORGANIZACION"
        ? String(orgValues?.razonesSociales?.[0]?.razonSocial ?? "").trim()
        : ""

    const hydrationKey = JSON.stringify({
      tipoSolicitante,
      disponibilidad: srcDisponibilidad ?? null,
      areas: srcAreas,
      razonSocial: srcRazonSocial,
    })

    if (hydratedKeyRef.current === hydrationKey) return
    hydratedKeyRef.current = hydrationKey

    if (srcDisponibilidad) {
      setFechaInicio(String(srcDisponibilidad.fechaInicio ?? ""))
      setFechaFin(String(srcDisponibilidad.fechaFin ?? ""))
      setDiasSeleccionados(Array.isArray(srcDisponibilidad.dias) ? srcDisponibilidad.dias : [])
      setHorariosSeleccionados(Array.isArray(srcDisponibilidad.horarios) ? srcDisponibilidad.horarios : [])
    } else {
      setFechaInicio("")
      setFechaFin("")
      setDiasSeleccionados([])
      setHorariosSeleccionados([])
    }

    const areaNames = (Array.isArray(srcAreas) ? srcAreas : [])
      .map((a: any) => String(a?.nombreArea ?? a ?? "").trim())
      .filter(Boolean)

    if (areaNames.length > 0) {
      const baseAreas = new Set(AREAS_OPCIONES)
      const known = areaNames.filter((a) => baseAreas.has(a))
      const unknown = areaNames.find((a) => !baseAreas.has(a))
      const next = unknown ? [...known, "Otro"] : known
      setAreasSeleccionadas(next)
      if (unknown) setOtraArea(unknown)
    } else {
      setAreasSeleccionadas([])
      setOtraArea("")
    }

    if (tipoSolicitante === "ORGANIZACION") {
      setRazonSocial(srcRazonSocial)
    } else {
      setRazonSocial("")
    }

    readyToSyncRef.current = false
  }, [tipoSolicitante, formData, form])

  useEffect(() => {
    if (!readyToSyncRef.current) {
      readyToSyncRef.current = true
      return
    }

    const disponibilidad = buildDisponibilidadPayload()
    const areasPayload = buildAreasPayload()

    if (tipoSolicitante === "ORGANIZACION" && formRef.current) {
      formRef.current.setFieldValue("organizacion.disponibilidades", [disponibilidad])
      formRef.current.setFieldValue("organizacion.areasInteres", areasPayload)

      formRef.current.setFieldValue("organizacion.razonesSociales", [
        { razonSocial: razonSocial.trim() },
      ])
    } else if (tipoSolicitante === "INDIVIDUAL" && handleRef.current) {
      handleRef.current("disponibilidades", [disponibilidad])
      handleRef.current("areasInteres", areasPayload)
    }

    if (showErrors) {
      const e1 = getDisponibilidadErrors(disponibilidad)
      const e2 = getAreasErrors(areasPayload)
      const e3 = getRazonSocialErrors(razonSocial)

      setErrors((prev) => {
        const next = { ...e1, ...e2, ...e3 }
        const same =
          prev.fechaInicio === next.fechaInicio &&
          prev.fechaFin === next.fechaFin &&
          prev.dias === next.dias &&
          prev.horarios === next.horarios &&
          prev.areasInteres === next.areasInteres &&
          prev.otraArea === next.otraArea &&
          prev.razonSocial === next.razonSocial
        return same ? prev : next
      })
    }
  }, [
    fechaInicio,
    fechaFin,
    diasSeleccionados,
    horariosSeleccionados,
    areasSeleccionadas,
    otraArea,
    razonSocial,
    tipoSolicitante,
    showErrors,
  ])

  const handleDiaChange = (dia: string) => {
    setDiasSeleccionados((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]))
  }

  const handleHorarioChange = (horario: string) => {
    setHorariosSeleccionados((prev) =>
      prev.includes(horario) ? prev.filter((h) => h !== horario) : [...prev, horario]
    )
  }

  const handleAreaChange = (area: string) => {
    setAreasSeleccionadas((prev) => (prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]))
  }

  const today = toISODate(todayDate)

  const parseISOToDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number)
    if (!y || !m || !d) return undefined
    const dt = new Date(y, m - 1, d)
    dt.setHours(0, 0, 0, 0)
    return dt
  }

  const minFechaFin = fechaInicio && fechaInicio > today ? fechaInicio : today
  const minFechaFinDate = parseISOToDate(minFechaFin) || new Date()

  const fechaInicioDate = fechaInicio ? parseISOToDate(fechaInicio) : undefined
  const fechaFinDate = fechaFin ? parseISOToDate(fechaFin) : undefined

  const disabledInicio = (date: Date) => {
    const dt = new Date(date)
    dt.setHours(0, 0, 0, 0)
    const min = parseISOToDate(today) || new Date()
    min.setHours(0, 0, 0, 0)
    return dt < min
  }

  const disabledFin = (date: Date) => {
    const dt = new Date(date)
    dt.setHours(0, 0, 0, 0)
    const min = new Date(minFechaFinDate)
    min.setHours(0, 0, 0, 0)
    return dt < min
  }

  const checkboxBase =
    "data-[state=checked]:bg-[#708C3E] data-[state=checked]:border-[#708C3E] data-[state=checked]:text-white border-[#DCD6C9]"

  const inputBase =
    "border-[#DCD6C9] focus-visible:ring-[#708C3E]/30 focus-visible:ring-2 focus-visible:ring-offset-0"

  return (
    <div className="space-y-6">
      {/* ========== DISPONIBILIDAD ========== */}
      <div className="bg-white rounded-xl shadow-md border border-[#DCD6C9]">
        <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[#708C3E]">Disponibilidad</h3>
          <p className="mt-1 text-xs text-gray-500">(Todos los campos son obligatorios a menos que contengan la etiqueta "Opcional") </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Fecha inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periodo de disponibilidad de inicio
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-between shadow-sm hover:bg-[#E6EDC8]/40 ${
                      showErrors && errors.fechaInicio ? "border-[#9c1414]" : "border-[#DCD6C9]"
                    }`}
                  >
                    <span className={fechaInicio ? "text-[#4A4A4A]" : "text-gray-400"}>
                      {fechaInicio || "Seleccione una fecha"}
                    </span>
                    <CalendarIcon className="h-4 w-4 text-[#708C3E]" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-3 rounded-xl border border-[#DCD6C9] shadow-md">
                  <Calendar
                    mode="single"
                    selected={fechaInicioDate}
                    locale={es}
                    onSelect={(d) => {
                      if (!d) return
                      const next = toISODate(d)
                      setFechaInicio(next)

                      if (fechaFin && fechaFin < (next > today ? next : today)) {
                        setFechaFin("")
                      }
                    }}
                    disabled={disabledInicio}
                    className="rounded-lg"
                    classNames={{
                      caption: "flex justify-center pt-1 relative items-center text-[#708C3E] font-semibold",
                      head_cell: "text-[#708C3E] w-9 font-semibold text-[0.8rem]",
                      day_selected:
                        "bg-[#708C3E] text-white hover:bg-[#5d7334] hover:text-white focus:bg-[#708C3E] focus:text-white",
                      day_today: "border border-[#A3853D]",
                      day_range_middle: "bg-[#E6EDC8] text-[#4A4A4A]",
                    }}
                  />
                </PopoverContent>
              </Popover>

              {showErrors && errors.fechaInicio && (
                <p className="text-sm text-[#9c1414] mt-1">{errors.fechaInicio}</p>
              )}
            </div>

            {/* Fecha fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Periodo de disponibilidad fin
              </label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full justify-between shadow-sm hover:bg-[#E6EDC8]/40 ${
                      showErrors && errors.fechaFin ? "border-[#9c1414]" : "border-[#DCD6C9]"
                    }`}
                  >
                    <span className={fechaFin ? "text-[#4A4A4A]" : "text-gray-400"}>
                      {fechaFin || "Seleccione una fecha"}
                    </span>
                    <CalendarIcon className="h-4 w-4 text-[#708C3E]" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-3 rounded-xl border border-[#DCD6C9] shadow-md">
                  <Calendar
                    mode="single"
                    selected={fechaFinDate}
                    locale={es}
                    onSelect={(d) => {
                      if (!d) return
                      setFechaFin(toISODate(d))
                    }}
                    disabled={disabledFin}
                    className="rounded-lg"
                    classNames={{
                      caption: "flex justify-center pt-1 relative items-center text-[#708C3E] font-semibold",
                      head_cell: "text-[#708C3E] w-9 font-semibold text-[0.8rem]",
                      day_selected:
                        "bg-[#708C3E] text-white hover:bg-[#5d7334] hover:text-white focus:bg-[#708C3E] focus:text-white",
                      day_today: "border border-[#A3853D]",
                      day_range_middle: "bg-[#E6EDC8] text-[#4A4A4A]",
                    }}
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Mínimo: <span className="font-medium text-[#708C3E]">{minFechaFin}</span>
                  </p>
                </PopoverContent>
              </Popover>

              {showErrors && errors.fechaFin && (
                <p className="text-sm text-[#9c1414] mt-1">{errors.fechaFin}</p>
              )}
            </div>
          </div>

          {/* Días disponibles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días disponibles <span className="text-gray-500 text-xs">(selección múltiple)</span>
            </label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {dias.map((dia) => {
                const checked = diasSeleccionados.includes(dia)
                return (
                  <label key={dia} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#E6EDC8]/30">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => handleDiaChange(dia)}
                      className={checkboxBase}
                    />
                    <span className="text-sm text-gray-700">{dia}</span>
                  </label>
                )
              })}
            </div>

            {showErrors && errors.dias && (
              <p className="text-sm text-[#9c1414] mt-1">{errors.dias}</p>
            )}
          </div>

          {/* Horario preferido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horario preferido <span className="text-gray-500 text-xs">(selección múltiple)</span>
            </label>

            <div className="space-y-2">
              {horarios.map((horario) => {
                const checked = horariosSeleccionados.includes(horario.value)
                return (
                  <label
                    key={horario.value}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#E6EDC8]/30"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => handleHorarioChange(horario.value)}
                      className={checkboxBase}
                    />
                    <span className="text-sm text-gray-700">{horario.label}</span>
                  </label>
                )
              })}
            </div>

            {showErrors && errors.horarios && (
              <p className="text-sm text-[#9c1414] mt-1">{errors.horarios}</p>
            )}
          </div>
        </div>
      </div>

      {/* ========== ÁREAS DE INTERÉS ========== */}
      <div className="bg-white rounded-xl shadow-md border border-[#DCD6C9]">
        <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-[#708C3E]">Áreas de interés</h3>
          <p className="mt-1 text-xs text-gray-500">Selección múltiple (mínimo 1)</p>
        </div>

        <div className="p-6 space-y-3">
          {AREAS_OPCIONES.map((area) => {
            const checked = areasSeleccionadas.includes(area)
            return (
              <label key={area} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#E6EDC8]/30">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => handleAreaChange(area)}
                  className={checkboxBase}
                />
                <span className="text-sm text-gray-700">{area}</span>
              </label>
            )
          })}

          {/* Otro */}
          <label className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[#E6EDC8]/30">
            <Checkbox
              checked={areasSeleccionadas.includes("Otro")}
              onCheckedChange={() => handleAreaChange("Otro")}
              className={checkboxBase}
            />
            <span className="text-sm text-gray-700">Otro (especificar)</span>
          </label>

          {areasSeleccionadas.includes("Otro") && (
            <div className="ml-6 mt-2 space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Si seleccionó "Otro", especifique <span className="text-gray-500 text-xs">(texto)</span>
              </label>

              <Input
                type="text"
                value={otraArea}
                maxLength={80}
                onChange={(e) => setOtraArea(e.target.value)}
                className={`${inputBase} bg-white ${showErrors && errors.otraArea ? "border-[#9c1414]" : ""}`}
              />
              {showErrors && errors.otraArea && (
                <p className="text-sm text-[#9c1414] mt-1">{errors.otraArea}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Especifique el área de interés</p>
            </div>
          )}

          {showErrors && errors.areasInteres && (
            <p className="text-sm text-[#9c1414] mt-1">{errors.areasInteres}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Seleccione áreas de la organización que sean de su interés o agregue una nueva
          </p>
        </div>
      </div>

      {/* ========== RAZÓN SOCIAL (Solo para Organización) ========== */}
      {tipoSolicitante === "ORGANIZACION" && (
        <div className="bg-white rounded-xl shadow-md border border-[#DCD6C9]">
          <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center gap-3">
            <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#708C3E]">Razón Social / Objetivos</h3>
            <p className="mt-1 text-xs text-gray-500">(Campo obligatorio)</p>
          </div>

          <div className="p-6 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Describa los objetivos o razón social de su organización
            </label>

            <Textarea
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              rows={3}
              maxLength={255}
              className={`${inputBase} resize-none bg-white ${showErrors && errors.razonSocial ? "border-[#9c1414]" : ""}`}
            />

            {showErrors && errors.razonSocial && (
              <p className="text-sm text-[#9c1414] mt-1">{errors.razonSocial}</p>
            )}

            <p className="mt-1 text-xs text-gray-500">
              Ejemplo: Promover la conservación del medio ambiente mediante educación y participación comunitaria...
            </p>
          </div>
        </div>
      )}
    </div>
  )
})