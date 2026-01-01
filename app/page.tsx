"use client";

import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<any>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const login = async () => {
    setResult("Cargando...");

    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "setorresg2015@gmail.com",
        password: "12345678",
      }),
    });

    const data = await res.json();
    setResult({ status: res.status, data });
  };

  return (
    <main style={{ padding: 24 }}>
      <h2>Nexum Frontend</h2>
      <p>
        <b>API URL:</b> {apiUrl}
      </p>

      <button onClick={login} style={{ padding: 10, marginTop: 12 }}>
        Probar Login
      </button>

      <pre style={{ marginTop: 16 }}>
        {result ? JSON.stringify(result, null, 2) : "Sin respuesta aún"}
      </pre>
    </main>
  );
}
