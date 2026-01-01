"use client";

import { useEffect, useMemo, useState } from "react";

/* =========================
   BLOQUE 1 — Tipos y estados
========================= */

type StatusKey = "disponible" | "seguimiento" | "actualizar" | "de_baja";

const STATUS_LABEL: Record<StatusKey, string> = {
  disponible: "Disponible",
  seguimiento: "En Proceso",
  actualizar: "Aceptado",
  de_baja: "Descartado",
};

type Candidate = {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string;
  correo?: string;
  puesto_aplica?: string;
  notas?: string;
  status: StatusKey;
};

/* =========================
   PAGE
========================= */

export default function PanelPage() {
  /* =========================
     BLOQUE 2 — Estados
  ========================= */

  const [active, setActive] = useState<StatusKey>("disponible");
  const [companyName, setCompanyName] = useState<string>("Empresa");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /* =========================
     BLOQUE 3 — useEffect (fetch)
  ========================= */

  useEffect(() => {
    try {
      const raw = localStorage.getItem("nexum_company");
      if (!raw) {
        setError("No hay empresa en sesión");
        setLoading(false);
        return;
      }

      const company = JSON.parse(raw);
      if (company?.name) setCompanyName(company.name);

      if (!company?.slug) {
        setError("Empresa sin slug");
        setLoading(false);
        return;
      }

      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/companies/${company.slug}/candidates`)
        .then((res) => {
          if (!res.ok) throw new Error("Error al cargar candidatos");
          return res.json();
        })
        .then((data: Candidate[]) => {
          setCandidates(data);
          setLoading(false);
        })
        .catch(() => {
          setError("No se pudo conectar al backend");
          setLoading(false);
        });
    } catch {
      setError("Sesión inválida");
      setLoading(false);
    }
  }, []);

  /* =========================
     BLOQUE 4 — Filtrado y render
  ========================= */

  const tabs = useMemo(
    () => Object.keys(STATUS_LABEL) as StatusKey[],
    []
  );

  const filtered = useMemo(
    () => candidates.filter((c) => c.status === active),
    [candidates, active]
  );

  return (
    <main style={{ minHeight: "100vh", padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
              Panel — {companyName}
            </h1>
            <p style={{ margin: 0, opacity: 0.7 }}>
              Pizarra de candidatos por estatus
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => (window.location.href = "/candidato/nuevo")}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Nuevo candidato
            </button>

            <button
              onClick={() => {
                localStorage.removeItem("nexum_token");
                localStorage.removeItem("nexum_company");
                window.location.href = "/login";
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Salir
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          {tabs.map((key) => {
            const isActive = key === active;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  fontWeight: 800,
                  cursor: "pointer",
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                {STATUS_LABEL[key]}
              </button>
            );
          })}
        </div>

        {/* Board */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            padding: 14,
            minHeight: 420,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              {STATUS_LABEL[active]}
            </h2>
            <div style={{ opacity: 0.7, fontSize: 13 }}>
              {loading
                ? "Cargando..."
                : `${filtered.length} candidato(s)`}
            </div>
          </div>

          {/* Estados */}
          {loading && <p>Cargando candidatos…</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && filtered.length === 0 && (
            <p style={{ opacity: 0.7 }}>
              No hay candidatos en este estatus
            </p>
          )}

          {/* Cards */}
          <div
            style={{
              marginTop: 14,
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {filtered.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 14,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 800 }}>
                  {c.nombres} {c.apellidos}
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {c.puesto_aplica}
                  <br />
                  {c.telefono}
                </div>

                {c.notas && (
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    📝 {c.notas}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                 <button
                    onClick={() => (window.location.href = `/panel/candidato/${c.id}`)}
                    style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        fontWeight: 700,
                        cursor: "pointer",
                    }}
                    >
                    Ver / Editar
                  </button>

                  <button
                    disabled
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      fontWeight: 700,
                      opacity: 0.6,
                    }}
                  >
                    Cambiar estatus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, opacity: 0.7, fontSize: 13 }}>
          La gestión de estados estará disponible al activar Nexum
        </div>
      </div>
    </main>
  );
}
