"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Credenciales inválidas");
        return;
      }

      // Si tu backend devuelve token/company, lo guardamos.
      // Ajusta keys según tu response real.
      if (data?.token) localStorage.setItem("nexum_token", data.token);
      if (data?.company) localStorage.setItem("nexum_company", JSON.stringify(data.company));

      // Redirigir al panel
      window.location.href = "/panel";
    } catch (err) {
      setError("No se pudo conectar al backend (3001).");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Login Empresa</h1>
        <p style={{ marginBottom: 16, opacity: 0.8 }}>
          Ingresa con el email y password de tu empresa.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="empresa@correo.com"
              required
              style={{ padding: 10, borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="********"
              required
              style={{ padding: 10, borderRadius: 10, border: "1px solid #d1d5db" }}
            />
          </label>

          {error && (
            <div style={{ padding: 10, borderRadius: 10, background: "#fee2e2", border: "1px solid #fecaca" }}>
              {String(error)}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>

          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
            API: {API_URL}
          </div>
        </form>
      </div>
    </main>
  );
}