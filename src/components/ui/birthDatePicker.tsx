import { useMemo, useState, memo, useEffect, useRef } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon } from "lucide-react"
import { es } from "date-fns/locale"
import { CustomSelect } from "@/shared/ui/CustomSelect"

interface BirthDatePickerProps {
  value?: string
  onChange: (date: string) => void
  minAge?: number
  placeholder?: string
  error?: string
  disabled?: boolean
  className?: string
}

function _BirthDatePicker({
  value,
  onChange,
  minAge = 18,
  placeholder = "Seleccione una fecha",
  error,
  disabled = false,
  className = "",
}: BirthDatePickerProps) {
  // Parsear ISO a Date
  const parseISOToDate = (iso?: string) => {
    if (!iso) return undefined
    const [y, m, d] = iso.split("-").map(Number)
    if (!y || !m || !d) return undefined
    const dt = new Date(y, m - 1, d)
    dt.setHours(0, 0, 0, 0)
    return dt
  }

  // Date -> ISO YYYY-MM-DD
  const toISODate = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  // Fecha máxima permitida (edad mínima)
  const maxBirthDateObj = useMemo(() => {
    const t = new Date()
    t.setFullYear(t.getFullYear() - minAge)
    t.setHours(0, 0, 0, 0)
    return t
  }, [minAge])

  const fromYear = 1950
  const toYear = maxBirthDateObj.getFullYear()

  const selectedDate = useMemo(() => parseISOToDate(value), [value])

  // Mes mostrado (controlado)
  const [displayMonth, setDisplayMonth] = useState<Date>(() => selectedDate ?? maxBirthDateObj)

  useEffect(() => {
    setDisplayMonth(selectedDate ?? maxBirthDateObj)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Deshabilitar fechas futuras para respetar edad mínima
  const disabledBirthDate = (date: Date) => {
    const dt = new Date(date)
    dt.setHours(0, 0, 0, 0)
    return dt > maxBirthDateObj
  }

  // Opciones de mes/año
  const monthNames = useMemo(
    () => [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ],
    []
  )

  const monthOptions = useMemo(
    () => monthNames.map((label, idx) => ({ value: idx, label })),
    [monthNames]
  )

  const years = useMemo(() => {
    const arr: number[] = []
    for (let y = toYear; y >= fromYear; y--) arr.push(y)
    return arr
  }, [fromYear, toYear])

  const yearOptions = useMemo(
    () => years.map((y) => ({ value: y, label: String(y) })),
    [years]
  )

  // Control del Popover (abrir/cerrar)
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const handleMonthChange = (monthValue: string | number) => {
    const newMonth = typeof monthValue === "string" ? parseInt(monthValue, 10) : (monthValue as number)
    if (Number.isNaN(newMonth)) return
    const next = new Date(displayMonth)
    next.setMonth(newMonth)
    setDisplayMonth(next)
  }

  const handleYearChange = (yearValue: string | number) => {
    const newYear = typeof yearValue === "string" ? parseInt(yearValue, 10) : (yearValue as number)
    if (Number.isNaN(newYear)) return
    const next = new Date(displayMonth)
    next.setFullYear(newYear)
    setDisplayMonth(next)
  }

  // Texto visible en el botón
  const displayText = useMemo(() => {
    if (!selectedDate) return placeholder
    return selectedDate.toLocaleDateString("es-CR", { day: "2-digit", month: "long", year: "numeric" })
  }, [placeholder, selectedDate])

 
return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            disabled={disabled}
            className={`w-full justify-between shadow-sm hover:bg-[#E6EDC8]/40 ${
              error ? "border-[#9c1414]" : "border-[#DCD6C9]"
            }`}
          >
            <span className={value ? "text-[#4A4A4A]" : "text-gray-400"}>{displayText}</span>
            <CalendarIcon className="h-4 w-4 text-[#708C3E]" />
          </Button>
        </PopoverTrigger>

        {/* POPUP MÁS PEQUEÑO */}
        <PopoverContent
          // ancho y paddings reducidos
          className="w-[260px] p-2 rounded-xl border border-[#DCD6C9] shadow-md"
        >
          {/* Selects con menor ancho y fuente más chica */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[120px]">
              <CustomSelect
                size="sm"
                value={displayMonth.getMonth()}
                onChange={handleMonthChange}
                options={monthOptions}
                placeholder="Mes"
                disabled={disabled}
                zIndex={50}
              />
            </div>

            <div className="w-[96px]">
              <CustomSelect
                size="sm"
                value={displayMonth.getFullYear()}
                onChange={handleYearChange}
                options={yearOptions}
                placeholder="Año"
                disabled={disabled}
                zIndex={50}
              />
            </div>
          </div>

          {/* CALENDARIO COMPACTO */}
          <Calendar
            mode="single"
            month={displayMonth}
            onMonthChange={(m) => setDisplayMonth(m)}
            selected={selectedDate}
            onSelect={(d) => {
              if (!d) return
              if (disabledBirthDate(d)) return
              onChange(toISODate(d))
              setOpen(false)
              setTimeout(() => triggerRef.current?.focus(), 0)
            }}
            locale={es}
            hideNavigation
            fromYear={fromYear}
            toYear={toYear}
            disabled={disabledBirthDate}
            defaultMonth={selectedDate ?? maxBirthDateObj}
            // Usamos una var CSS para controlar el tamaño de celda
            // y reducimos tipografías/gaps.
            className="rounded-lg [--cell:28px]"
            classNames={{
              // Contenedor de meses (siempre 1)
              months: "flex flex-col",
              month: "space-y-2",
              // caption oculto (ya lo tenías), pero ajustamos label si aparece
              caption: "hidden",
              caption_label: "text-xs font-medium capitalize",
              // cabecera y celdas de la semana
              head_row: "flex",
              head_cell:
                "text-[#708C3E] w-[var(--cell)] h-6 grid place-items-center font-semibold text-[11px] capitalize",
              // grilla de días
              row: "flex gap-[2px]",
              table: "w-full border-collapse",
              // Día: reducimos alto/ancho a la variable --cell y la fuente
              day: "h-[var(--cell)] w-[var(--cell)] p-0 text-[12px] font-normal aria-selected:opacity-100",
              day_button:
                "h-full w-full rounded-md grid place-items-center outline-none transition-colors hover:bg-[#E6EDC8]/60 focus-visible:ring-2 focus-visible:ring-[#708C3E]/30",
              day_selected:
                "bg-[#708C3E] text-white hover:bg-[#5d7334] hover:text-white focus:bg-[#708C3E] focus:text-white",
              day_today: "border border-[#A3853D]",
              day_disabled: "text-gray-300 opacity-50",
              // opcional: celdas fuera de mes más claras
              day_outside: "text-gray-300 opacity-60",
            }}
          />

          <p className="mt-2 text-[10px] text-gray-500">
            Debe ser mayor de <span className="font-medium text-[#6F8C1F]">{minAge} años</span>.
          </p>
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-[#9c1414] mt-1">{error}</p>}
    </div>
  )
}


export const BirthDatePicker = memo(_BirthDatePicker)
