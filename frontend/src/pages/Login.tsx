import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: FormEvent) {
    e.preventDefault();

    if (!email.trim() || !senha.trim()) {
      setErro("Preencha e-mail e senha para entrar.");
      setSucesso("");
      return;
    }

    setCarregando(true);
    setErro("");
    setSucesso("");

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
    if (!email.trim() || !senha.trim()) {
      setErro(
        "Preencha E-mail e Senha nos campos acima para criar a conta inicial.",
      );
      setSucesso("");
      return;
    }

    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const response = await fetch("http://localhost:3000/api/usuarios/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: "Gerente Principal",
          email: email.trim(),
          senha: senha,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setSucesso(data.message || "Usuário inicial criado com sucesso!");
      } else {
        setErro(
          data.message ||
            data.error ||
            "Não foi possível criar o usuário inicial.",
        );
      }
    } catch (error) {
      setErro("Erro ao conectar com o servidor para criar o usuário inicial.");
    } finally {
      setCarregando(false);
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

        {sucesso && (
          <p
            style={{
              color: "#15803d",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "13px",
              textAlign: "center",
              margin: "10px 0",
            }}
          >
            {sucesso}
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primario"
          disabled={carregando}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={handleSeed}
          disabled={carregando}
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
