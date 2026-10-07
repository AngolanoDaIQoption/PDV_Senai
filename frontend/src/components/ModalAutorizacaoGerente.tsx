import { useState, type FormEvent } from "react";

interface ModalAutorizacaoGerenteProps {
  aberto: boolean;
  onFechar: () => void;
  onAutorizar: () => void;
}

export default function ModalAutorizacaoGerente({
  aberto,
  onFechar,
  onAutorizar,
}: ModalAutorizacaoGerenteProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  if (!aberto) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // TODO Sprint 5: validar credenciais do gerente com a API (ex: POST /auth/validar-gerente)
    onAutorizar();
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <h2>Autorização de Gerente</h2>
        <p className="texto-suave" style={{ margin: "4px 0 16px" }}>
          Desconto acima do limite permitido para caixa. Solicite a liberação de um gerente.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          <label>
            E-mail do gerente
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gerente@loja.com"
              required
              autoFocus
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <div className="linha" style={{ justifyContent: "flex-end", marginTop: "8px" }}>
            <button type="button" className="btn btn-secundario" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario">
              Autorizar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

