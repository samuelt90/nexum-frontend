"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Candidate = {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  municipio?: string;
  direccion?: string;
  puesto_aplica?: string;
  anios_experiencia?: number;
  pretension_salarial?: number;
  cv_url?: string;
  status?: string;
  notes?: string | null;
  created_at?: string;
};

type CandidateForm = {
  nombres: string;
  apellidos: string;
  puesto_aplica: string;
  telefono: string;
  correo: string;
  municipio: string;
  direccion: string;
  anios_experiencia: string; // string para input number
  pretension_salarial: string; // string para input number
  status: string;
  notes: string;
  cv_url: string;
};

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const API_BASE = useMemo(() => {
    
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  }, []);

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [form, setForm] = useState<CandidateForm | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const raw = localStorage.getItem("nexum_company");
    if (!raw) {
      setError("No hay empresa en sesión");
      setLoading(false);
      return;
    }

    let company: any = null;
    try {
      company = JSON.parse(raw);
    } catch {
      setError("Sesión inválida");
      setLoading(false);
      return;
    }

    // Mantengo tu validación existente
    if (!company?.slug) {
      setError("Empresa sin slug");
      setLoading(false);
      return;
    }

    setError(null);
    setSuccess(null);

    fetch(`${API_BASE}/candidates/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el candidato");
        return res.json();
      })
      .then((data: Candidate) => {
        setCandidate(data);

        // Inicializa form editable
        setForm({
          nombres: data.nombres ?? "",
          apellidos: data.apellidos ?? "",
          puesto_aplica: data.puesto_aplica ?? "",
          telefono: data.telefono ?? "",
          correo: data.correo ?? "",
          municipio: data.municipio ?? "",
          direccion: data.direccion ?? "",
          anios_experiencia:
            data.anios_experiencia === undefined || data.anios_experiencia === null
              ? ""
              : String(data.anios_experiencia),
          pretension_salarial:
            data.pretension_salarial === undefined || data.pretension_salarial === null
              ? ""
              : String(data.pretension_salarial),
          status: data.status ?? "",
          notes: data.notes ?? "",
          cv_url: data.cv_url ?? "",
        });

        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo conectar al backend");
        setLoading(false);
      });
  }, [id, API_BASE]);

  function updateForm<K extends keyof CandidateForm>(key: K, value: CandidateForm[K]) {
    setSuccess(null);
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!id || !form) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    // Armamos payload para PATCH (con números reales)
    const payload: Partial<Candidate> = {
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      puesto_aplica: form.puesto_aplica.trim(),
      telefono: form.telefono.trim(),
      correo: form.correo.trim(),
      municipio: form.municipio.trim(),
      direccion: form.direccion.trim(),
      status: form.status.trim(),
      notes: form.notes.trim() === "" ? null : form.notes,
      cv_url: form.cv_url.trim(),
      anios_experiencia: form.anios_experiencia === "" ? undefined : Number(form.anios_experiencia),
      pretension_salarial:
        form.pretension_salarial === "" ? undefined : Number(form.pretension_salarial),
    };

    try {
      const res = await fetch(`${API_BASE}/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("No se pudo guardar");

      const updated: Candidate = await res.json();
      setCandidate(updated);

      // Re-sync del form por si backend normaliza algo
      setForm({
        nombres: updated.nombres ?? "",
        apellidos: updated.apellidos ?? "",
        puesto_aplica: updated.puesto_aplica ?? "",
        telefono: updated.telefono ?? "",
        correo: updated.correo ?? "",
        municipio: updated.municipio ?? "",
        direccion: updated.direccion ?? "",
        anios_experiencia:
          updated.anios_experiencia === undefined || updated.anios_experiencia === null
            ? ""
            : String(updated.anios_experiencia),
        pretension_salarial:
          updated.pretension_salarial === undefined || updated.pretension_salarial === null
            ? ""
            : String(updated.pretension_salarial),
        status: updated.status ?? "",
        notes: updated.notes ?? "",
        cv_url: updated.cv_url ?? "",
      });

      setSuccess("Cambios guardados ✅");
    } catch {
      setError("No se pudo guardar (revisa backend/puerto)");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Ver / Editar candidato</h1>
            <p style={{ margin: 0, opacity: 0.7, fontSize: 13 }}>ID: {id}</p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => history.back()}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontWeight: 700,
                cursor: "pointer",
                height: 42,
                alignSelf: "start",
                background: "white",
              }}
            >
              ← Volver
            </button>

            <button
              onClick={handleSave}
              disabled={saving || loading || !form}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111827",
                fontWeight: 800,
                cursor: saving || loading ? "not-allowed" : "pointer",
                height: 42,
                alignSelf: "start",
                background: saving || loading ? "#e5e7eb" : "#111827",
                color: saving || loading ? "#111827" : "white",
              }}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 14,
          }}
        >
          {loading && <p>Cargando…</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>{success}</p>}

          {!loading && !error && form && (
            <>
              <div style={{ fontSize: 18, fontWeight: 800 }}>
                {form.nombres} {form.apellidos}
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <FieldInput label="Nombres" value={form.nombres} onChange={(v) => updateForm("nombres", v)} />
                <FieldInput label="Apellidos" value={form.apellidos} onChange={(v) => updateForm("apellidos", v)} />

                <FieldInput label="Puesto" value={form.puesto_aplica} onChange={(v) => updateForm("puesto_aplica", v)} />
                <FieldInput label="Teléfono" value={form.telefono} onChange={(v) => updateForm("telefono", v)} />
                <FieldInput label="Correo" value={form.correo} onChange={(v) => updateForm("correo", v)} />
                <FieldInput label="Municipio" value={form.municipio} onChange={(v) => updateForm("municipio", v)} />
                <FieldInput label="Dirección" value={form.direccion} onChange={(v) => updateForm("direccion", v)} />

                <FieldInput
                  label="Años experiencia"
                  value={form.anios_experiencia}
                  type="number"
                  onChange={(v) => updateForm("anios_experiencia", v)}
                />

                <FieldInput
                  label="Pretensión salarial"
                  value={form.pretension_salarial}
                  type="number"
                  onChange={(v) => updateForm("pretension_salarial", v)}
                />

                <FieldInput label="Status" value={form.status} onChange={(v) => updateForm("status", v)} />

                <FieldTextarea label="Notas" value={form.notes} onChange={(v) => updateForm("notes", v)} />
                <FieldInput label="CV URL" value={form.cv_url} onChange={(v) => updateForm("cv_url", v)} />
              </div>

              <div style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
                (Demo: edición activa. Guardar hace PATCH y persiste en MySQL.)
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        style={{
          width: "100%",
          marginTop: 6,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          fontSize: 14,
          outline: "none",
        }}
      />
    </div>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>{label}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        style={{
          width: "100%",
          marginTop: 6,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          fontSize: 14,
          outline: "none",
          resize: "vertical",
        }}
      />
    </div>
  );
}
