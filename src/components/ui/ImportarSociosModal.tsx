import type { FC } from "react";
import { useState } from "react";
import Button from "./button";
import { useAuth } from "@/context/AuthContext";

interface ImportarSociosModalProps {
  onClose: () => void;
  onImported?: () => void;
}

const ImportarSociosModal: FC<ImportarSociosModalProps> = ({ onClose, onImported }) => {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSummary(null);

    if (!token) {
      setError("Debes iniciar sesión como admin.");
      return;
    }

    if (!file) {
      setError("Selecciona un archivo CSV.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/users/import-csv", {
        method: "POST",
        headers: {
          "Content-Type": "text/csv",
          Authorization: `Bearer ${token}`,
        },
        body: await file.text(),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? `Error ${res.status} al importar el CSV`);
        return;
      }

      const data: { created: number; updated: number; errors?: { line: number; message: string }[] } =
        await res.json();

      setSummary(
        `Importación completada. Creados: ${data.created}, actualizados: ${data.updated}`,
      );

      if (data.errors && data.errors.length > 0) {
        setSummary(
          (prev) =>
            (prev ?? "") + `. Filas con error: ${data.errors.length}. Consulta la consola para más detalles.`,
        );
        console.warn("Errores al importar CSV de socios", data.errors);
      }

      if (onImported) onImported();
    } catch (err: any) {
      setError(err?.message ?? "Error al importar el CSV");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rc-modal-overlay" onClick={onClose}>
      <div
        className="rc-modal-panel max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-dark text-xl font-semibold"
          aria-label="Cerrar"
        >
          ✕
        </button>

        <div className="mb-6">
          <h2 className="rc-modal-title">Importar socios desde CSV</h2>
          <p className="rc-modal-subtitle text-sm">
            El archivo debe tener cabecera con las columnas: <strong>email, name, phone, role</strong>.
            &nbsp;Los usuarios nuevos se crean con contraseña por defecto <code>socio123</code>
            &nbsp;y los existentes se actualizan.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-error mb-2">{error}</p>}
          {summary && <p className="text-sm text-success mb-2">{summary}</p>}

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
            }}
          />

          <div className="rc-modal-footer">
            <Button
              type="button"
              onClick={onClose}
              className="w-full md:w-auto rc-btn-secondary"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full md:w-auto rc-btn-primary"
              disabled={submitting}
            >
              {submitting ? "Importando..." : "Importar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportarSociosModal;

