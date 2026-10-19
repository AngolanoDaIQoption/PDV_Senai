import { useState, useEffect, type FormEvent } from "react"; // Hooks do React para estado, efeito colateral e tipagem do evento do formulário
import { useNavigate } from "react-router-dom"; // Hook que permite navegar entre páginas programaticamente
import { login } from "../services/api"; // Chamada de autenticação com a API do backend

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  // Estado e persistência do Modo Escuro no ecrã de Login
  const [isDark, setIsDark] = useState<boolean>(() => {
    const temaSalvo = localStorage.getItem("tema");
    if (temaSalvo) return temaSalvo === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
      localStorage.setItem("tema", "dark");
    } else {
      document.body.classList.remove("dark");
      localStorage.setItem("tema", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Pedimos um token à API e guardamos a sessão para as próximas telas.
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

  // O setup inicial só cria o primeiro gerente se a base ainda não tiver usuários.
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
    } catch {
      setErro("Erro ao conectar com o servidor para criar o usuário inicial.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-tela" style={{ position: "relative" }}>
      {/* Botão de Alternância de Tema no canto superior direito */}
      <div style={{ position: "absolute", top: "20px", right: "20px" }}>
        <button
          type="button"
          className="btn btn-secundario"
          onClick={toggleTheme}
          title={isDark ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
          style={{ padding: "6px 12px", fontSize: "0.85rem" }}
        >
          {isDark ? "☀️ Claro" : "🌙 Escuro"}
        </button>
      </div>

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
              color: isDark ? "#4ade80" : "#15803d",
              backgroundColor: isDark ? "#064e3b" : "#f0fdf4",
              border: `1px solid ${isDark ? "#059669" : "#bbf7d0"}`,
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
            color: "var(--texto-suave)",
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