import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha para entrar.");
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const resposta = await login(email.trim(), senha);
      localStorage.setItem("token", resposta.token);
      localStorage.setItem("usuario", JSON.stringify(resposta.usuario));
      navigate("/pdv");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleSeed() {
    try {
      const response = await fetch("http://localhost:3000/api/usuarios/seed", {
        method: "POST",
      });
      const data = await response.json();
      alert(data.message || data.error);
    } catch {
      alert("Erro ao conectar com o servidor para criar o usuário inicial.");
    }
  }

  return (
    <div className="login-tela">
      <form className="card login-card" onSubmit={entrar}>
        <h1>MS² Vestuário</h1>
        <p className="texto-suave">Entre para abrir o caixa.</p>

        <label>
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@ms2.com"
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </label>

        {erro && <p className="erro">{erro}</p>}

        <button type="submit" className="btn btn-primario" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={handleSeed}
          style={{
            marginTop: "12px",
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "12px",
            textDecoration: "underline",
            cursor: "pointer",
            width: "100%",
            textAlign: "center",
          }}
        >
          Criar Usuário Inicial (Setup)
        </button>
      </form>
    </div>
  );
}