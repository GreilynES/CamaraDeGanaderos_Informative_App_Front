import { useEffect, useRef } from "react"
import type { FieldLike, FormLike } from "../../../shared/types/form-lite"
import Swal from "sweetalert2"
import { showLoading, stopLoadingWithSuccess } from "../../utils/alerts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Send, BadgeCheck } from "lucide-react"
import { btn } from "@/shared/ui/buttonStyles"

export function TermsAndSubmit({
  form,
  isSubmitting,
  prevStep,
}: {
  form: FormLike
  isSubmitting?: boolean
  prevStep: () => void
}) {
  const wasSubmittingRef = useRef(false)

  useEffect(() => {
    if (isSubmitting && !wasSubmittingRef.current) {
      wasSubmittingRef.current = true
      showLoading("Enviando solicitud...")
    }

    if (!isSubmitting && wasSubmittingRef.current) {
      wasSubmittingRef.current = false
      stopLoadingWithSuccess("Solicitud enviada correctamente.")
    }
  }, [isSubmitting])

  useEffect(() => {
    return () => {
      if (Swal.isVisible()) Swal.close()
    }
  }, [])

  // 👇 dejamos el error igual, pero lo mostramos dentro del Field para que re-renderice bien
  const getErr = () =>
    (form as any).state?.errors?.acceptTerms ||
    (form as any).state?.meta?.errors?.acceptTerms?.[0]?.message ||
    ""

 return (
  <div className="bg-white border border-[#DCD6C9] rounded-xl shadow-md">
    {/* Header */}
    <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center gap-3">
      <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center">
        <BadgeCheck className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-[#708C3E]">
        Términos y condiciones
      </h3>
    </div>

    <div className="p-6 space-y-6 text-[#4A4A4A]">
      
      {/* Texto descriptivo */}
      <p className="text-sm">
        Antes de enviar tu solicitud, confirma tu consentimiento para el tratamiento de tus datos personales con fines de registro y gestión del proceso.
      </p>

      {/* BLOQUE tipo voluntarios */}
      <form.Field
        name="acceptTerms"
        validators={{
          onChange: ({ value }: any) => {
            if (!value) return "Debes aceptar los términos y condiciones para continuar"
            return undefined
          },
          onBlur: ({ value }: any) => {
            if (!value) return "Debes aceptar los términos y condiciones para continuar"
            return undefined
          },
          onSubmit: ({ value }: any) => {
            if (!value) return "Debes aceptar los términos y condiciones para continuar"
            return undefined
          },
        }}
      >
        {(f: FieldLike<boolean>) => {
          const accepted = !!f.state.value
          const err =
            getErr() ||
            (Array.isArray((f as any)?.state?.meta?.errors)
              ? String((f as any).state.meta.errors?.[0] ?? "")
              : "")

          return (
            <>
              <div className="rounded-xl border border-[#DCD6C9] bg-[#F3F1EA] p-4">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={accepted}
                    onCheckedChange={(v) => f.handleChange(Boolean(v))}
                    onBlur={f.handleBlur}
                    className="mt-0.5 border-[#DCD6C9] data-[state=checked]:bg-[#708C3E] data-[state=checked]:border-[#708C3E]"
                  />

                  <div className="text-sm leading-relaxed">
                    <p className="font-medium text-[#4A4A4A]">
                      Acepto los términos y condiciones
                    </p>
                    <p className="text-[#4A4A4A] mt-1">
                      Autorizo el uso de mis datos personales para el registro,
                      verificación y seguimiento de esta solicitud, de conformidad
                      con la normativa aplicable.
                    </p>
                  </div>
                </label>
              </div>

              {err ? <p className="text-sm text-red-600">{err}</p> : null}

              {/* Botones */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className={`${btn.outlineGray} h-10 px-4 text-sm`}
                >
                  <ArrowLeft className="size-4" />
                  Volver
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !accepted}
                  className={`${btn.primary} ${btn.disabledSoft} h-10 px-4 text-sm`}
                >
                  <Send className="size-4" />
                  {isSubmitting ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </div>
            </>
          )
        }}
      </form.Field>
    </div>
  </div>
)
}