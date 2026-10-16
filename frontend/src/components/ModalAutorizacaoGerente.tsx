import { useState, type FormEvent } from "react";

interface ModalAutorizacaoGerenteProps {
  onFechar: () => void;
  onAutorizar: (email: string, senha: string) => Promise<void>;
}

export default function ModalAutorizacaoGerente({
  onFechar,
  onAutorizar,
}: ModalAutorizacaoGerenteProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Enviamos as credenciais ao fluxo do caixa e mantemos o modal aberto se a validação falhar.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    try {
      await onAutorizar(email.trim(), senha);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível autorizar a venda.");
    } finally {
      setCarregando(false);
    }
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
              disabled={carregando}
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
              disabled={carregando}
            />
          </label>

          {erro && <p className="erro">{erro}</p>}

          <div className="linha" style={{ justifyContent: "flex-end", marginTop: "8px" }}>
            <button type="button" className="btn btn-secundario" onClick={onFechar} disabled={carregando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={carregando}>
              {carregando ? "Validando..." : "Autorizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
