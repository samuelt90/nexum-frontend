"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";

type FormData = {
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
  puesto_aplica: string;
  anios_experiencia: string; // texto, luego lo convertimos a number
  pretension_salarial: string; // texto, luego lo convertimos a number
  nivel_estudio: string;
  municipio: string;
  direccion: string;
  resumen: string;
  cv_url: string;
};

const NIVEL_ESTUDIO = [
  "Primaria",
  "Básico",
  "Bachiller / Diversificado",
  "Técnico",
  "Universitario (en curso)",
  "Universitario (completo)",
  "Postgrado",
];

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

function onlyMoney(v: string) {
  // Permite: 123, 123.45
  // Limpia todo excepto dígitos y un punto
  const cleaned = v.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`; // un solo punto
}

function normalizeSlug(raw: string | string[] | undefined): string {
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

export default function ApplyPage() {
  const params = useParams<{ companySlug: string }>();
  const companySlug = normalizeSlug(params?.companySlug);

  const [data, setData] = useState<FormData>({
    nombres: "",
    apellidos: "",
    telefono: "",
    correo: "",
    puesto_aplica: "",
    anios_experiencia: "",
    pretension_salarial: "",
    nivel_estudio: "",
    municipio: "",
    direccion: "",
    resumen: "",
    cv_url: "",
  });

  const [msg, setMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const requiredOrder: Array<{ key: keyof FormData; label: string }> = [
    { key: "nombres", label: "Nombres" },
    { key: "apellidos", label: "Apellidos" },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo electrónico" },
    { key: "puesto_aplica", label: "Puesto al que aplica" },
    { key: "anios_experiencia", label: "Años de experiencia" },
    { key: "pretension_salarial", label: "Pretensión salarial (Q)" },
    { key: "nivel_estudio", label: "Nivel de estudio" },
    { key: "municipio", label: "Municipio" },
    { key: "direccion", label: "Dirección" },
    { key: "resumen", label: "Resumen de experiencia" },
  ];

  const missingFieldLabel = useMemo(() => {
    for (const f of requiredOrder) {
      const val = (data[f.key] ?? "").trim();
      if (!val) return f.label;
    }

    // validaciones extra
    if (data.telefono.trim() && data.telefono.trim().length < 8) {
      return "Teléfono (mínimo 8 dígitos)";
    }
    if (data.correo.trim() && !/^\S+@\S+\.\S+$/.test(data.correo.trim())) {
      return "Correo electrónico válido";
    }
    if (data.anios_experiencia.trim() && Number.isNaN(Number(data.anios_experiencia))) {
      return "Años de experiencia (solo números)";
    }
    if (data.pretension_salarial.trim() && Number.isNaN(Number(data.pretension_salarial))) {
      return "Pretensión salarial (solo números)";
    }

    return null;
  }, [data]);

  const canSubmit = !missingFieldLabel && !submitting;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!companySlug) {
      setMsg("Empresa no encontrada (slug vacío).");
      return;
    }

    if (missingFieldLabel) {
      setMsg(`Falta completar: ${missingFieldLabel}`);
      return;
    }

    setSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL!;
      const url = `${baseUrl}/companies/${encodeURIComponent(companySlug)}/candidates`;

      // Payload alineado a lo que usaste en Postman + extras del formulario
      // Si tu backend no tiene nivel_estudio/resumen todavía, lo correcto es agregarlos en el DTO/entity.
      const payload = {
        nombres: data.nombres.trim(),
        apellidos: data.apellidos.trim(),
        telefono: data.telefono.trim(),
        correo: data.correo.trim(),
        municipio: data.municipio.trim(),
        direccion: data.direccion.trim(),
        puesto_aplica: data.puesto_aplica.trim(),
        anios_experiencia: Number(data.anios_experiencia),
        pretension_salarial: Number(data.pretension_salarial),
        // extras de ficha digital:
        nivel_estudio: data.nivel_estudio.trim(),
        resumen: data.resumen.trim(),
        cv_url: data.cv_url.trim(),
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const j = await res.json();
          detail = j?.message ? ` - ${Array.isArray(j.message) ? j.message.join(", ") : j.message}` : "";
        } catch {
          // ignore
        }
        throw new Error(`Error guardando candidato (${res.status})${detail}`);
      }

      setMsg("✅ Registro enviado. Revisa tu correo para confirmación.");
      setData({
        nombres: "",
        apellidos: "",
        telefono: "",
        correo: "",
        puesto_aplica: "",
        anios_experiencia: "",
        pretension_salarial: "",
        nivel_estudio: "",
        municipio: "",
        direccion: "",
        resumen: "",
        cv_url: "",
      });
    } catch (err: any) {
      setMsg(err?.message || "Error inesperado guardando candidato.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Registro de candidato</h1>

        <p style={{ marginTop: 6, opacity: 0.75 }}>
          Empresa: <b>{companySlug || "-"}</b>
        </p>

        <div
          style={{
            marginTop: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field
                label="Nombres"
                value={data.nombres}
                onChange={(v) => setField("nombres", v)}
                required
              />
              <Field
                label="Apellidos"
                value={data.apellidos}
                onChange={(v) => setField("apellidos", v)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field
                label="Teléfono"
                value={data.telefono}
                onChange={(v) => setField("telefono", onlyDigits(v))}
                required
                inputMode="numeric"
              />
              <Field
                label="Correo electrónico"
                value={data.correo}
                onChange={(v) => setField("correo", v)}
                type="email"
                required
              />
            </div>

            <Field
              label="Puesto al que aplica"
              value={data.puesto_aplica}
              onChange={(v) => setField("puesto_aplica", v)}
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field
                label="Años de experiencia"
                value={data.anios_experiencia}
                onChange={(v) => setField("anios_experiencia", onlyDigits(v))}
                required
                inputMode="numeric"
              />
              <Field
                label="Pretensión salarial (Q)"
                value={data.pretension_salarial}
                onChange={(v) => setField("pretension_salarial", onlyMoney(v))}
                required
                inputMode="decimal"
              />
            </div>

            <Select
              label="Nivel de estudio"
              value={data.nivel_estudio}
              onChange={(v) => setField("nivel_estudio", v)}
              options={NIVEL_ESTUDIO}
              required
            />

            <Field
              label="Municipio"
              value={data.municipio}
              onChange={(v) => setField("municipio", v)}
              required
            />

            <Field
              label="Dirección"
              value={data.direccion}
              onChange={(v) => setField("direccion", v)}
              required
            />

            <Textarea
              label="Resumen de experiencia"
              value={data.resumen}
              onChange={(v) => setField("resumen", v)}
              placeholder='Ej: "He trabajado como cajero, atención al cliente, cierre de caja..."'
              required
            />

            <Field
                label="CV (URL)"
                value={data.cv_url}
                onChange={(v) => setField("cv_url", v)}
                required
                />

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                height: 44,
                borderRadius: 12,
                border: "1px solid #111827",
                fontWeight: 800,
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.45,
              }}
            >
              {submitting ? "Guardando..." : "Guardar datos"}
            </button>

            {!canSubmit && missingFieldLabel && (
              <p style={{ margin: 0, opacity: 0.8, fontSize: 12 }}>
                Para continuar, completa: <b>{missingFieldLabel}</b>
              </p>
            )}

            {msg && (
              <p style={{ margin: 0, opacity: 0.85 }}>
                {msg}
              </p>
            )}

            <p style={{ margin: 0, opacity: 0.6, fontSize: 12 }}>
              No subas tu CV aquí. Si la empresa continúa tu proceso, te lo solicitará.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 700 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type || "text"}
        inputMode={inputMode}
        style={{
          height: 40,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "0 12px",
        }}
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 700 }}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        rows={4}
        style={{
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: 12,
          resize: "vertical",
        }}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  required,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  options: string[];
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, opacity: 0.75, fontWeight: 700 }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          height: 40,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          padding: "0 12px",
          background: "white",
        }}
      >
        <option value="">Selecciona una opción</option>
        {options.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
    </label>
  );
}