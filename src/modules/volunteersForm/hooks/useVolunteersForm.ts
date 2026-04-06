import { useCallback, useMemo, useState } from "react";
import type { VolunteersFormData } from "../../volunteersInformation/models/VolunteersType";

export function useVolunteersForm() {
  const [step, setStep] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [tipoSolicitante, setTipoSolicitante] = useState<"INDIVIDUAL" | "ORGANIZACION">(
    "INDIVIDUAL"
  );

  const [formData, setFormData] = useState<VolunteersFormData>({
    name: "",
    lastName1: "",
    lastName2: "",
    idNumber: "",
    birthDate: "",
    phone: "",
    email: "",
    address: "",
    community: "",
    volunteeringType: "",
    availability: "",
    previousExperience: "",
    motivation: "",
    acceptTerms: false,
    receiveInfo: false,
    nacionalidad: "",
    disponibilidades: [],
    areasInteres: [],
  });

  const [files, setFiles] = useState<{
    cv?: File | null;
    cedula?: File | null;
    carta?: File | null;
  }>({
    cv: null,
    cedula: null,
    carta: null,
  });

  const nextStep = useCallback(() => setStep((prev) => prev + 1), []);
  const prevStep = useCallback(() => setStep((prev) => Math.max(prev - 1, 1)), []);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canProceed = useMemo(() => {
    const hasText = (v: any) => String(v ?? "").trim().length > 0;
    const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim());
    const isValidDate = (v: string) => {
      if (!hasText(v)) return false;
      const d = new Date(v);
      return !Number.isNaN(d.getTime());
    };

    const disponibilidad = formData.disponibilidades?.[0];
    const disponibilidadValida = !!(
      disponibilidad &&
      hasText(disponibilidad.fechaInicio) &&
      hasText(disponibilidad.fechaFin) &&
      Array.isArray(disponibilidad.dias) &&
      disponibilidad.dias.length > 0 &&
      Array.isArray(disponibilidad.horarios) &&
      disponibilidad.horarios.length > 0
    );

    const areasValidas = Array.isArray(formData.areasInteres) && formData.areasInteres.length > 0;
    const motivacionValida = String(formData.motivation ?? "").trim().length >= 10;
    const habilidadesValidas = String(formData.volunteeringType ?? "").trim().length >= 1;

    if (tipoSolicitante === "INDIVIDUAL") {
      switch (step) {
        case 1:
          return (
            hasText(formData.name) &&
            hasText(formData.lastName1) &&
            hasText(formData.lastName2) &&
            String(formData.idNumber ?? "").trim().length >= 8 &&
            isValidDate(formData.birthDate) &&
            String(formData.phone ?? "").trim().length >= 8 &&
            isValidEmail(formData.email)
          );
        case 2:
          return disponibilidadValida && areasValidas;
        case 3:
          return motivacionValida && habilidadesValidas;
        case 4:
          return !!files.cv && !!files.cedula; // Carta opcional para individual
        default:
          return true;
      }
    }

    if (tipoSolicitante === "ORGANIZACION") {
      switch (step) {
        case 1:
          return true; // Se valida en el form de TanStack
        case 2:
          return disponibilidadValida && areasValidas;
        case 3:
          return !!files.cedula && !!files.carta; // Documento legal + carta
        case 4:
          return true; // Confirmación
        default:
          return true;
      }
    }

    return true;
  }, [tipoSolicitante, step, formData, files]);

 const resetToFirstStep = useCallback(() => {
  setStep(1);
}, []);
  const isStepValid = useCallback(() => canProceed, [canProceed]);

  return {
    formData,
    setFormData,
    step,
    nextStep,
    prevStep,
    showForm,
    setShowForm,
    tipoSolicitante,
    setTipoSolicitante,
    handleInputChange,
    canProceed,
    resetToFirstStep,
    isStepValid,
    files,
    setFiles,
  };
}