import { useEffect, useState } from "react";
import type { Perfil, Usuario } from "../types";
import { atualizarUsuario, buscarUsuarios, criarUsuario } from "../services/api";

const perfis: Perfil[] = ["CAIXA", "SUPERVISOR"];
const formularioInicial = {
  nome: "",
  email: "",
  senha: "",
  perfil: "CAIXA" as Perfil,
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [form, setForm] = useState(formularioInicial);
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  async function carregarUsuarios() {
    try {
      setErro("");
      const dados = await buscarUsuarios();
      setUsuarios(dados);
    } catch (err) {
      console.error(err);
      setErro("Não foi possível carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function mudarPerfil(id: number, perfil: Perfil) {
    try {
      setSalvandoId(id);
      setErro("");
      await atualizarUsuario(id, { perfil });
      setUsuarios((lista) =>
        lista.map((usuario) => (usuario.id === id ? { ...usuario, perfil } : usuario))
      );
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Não foi possível atualizar o perfil.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function alternarAtivo(usuario: Usuario) {
    if (usuario.perfil === "GERENTE") {
      setErro("O perfil de gerente não pode ser inativado.");
      return;
    }

    try {
      setSalvandoId(usuario.id);
      setErro("");
      const ativo = !(usuario.ativo ?? true);
      await atualizarUsuario(usuario.id, { ativo });
      setUsuarios((lista) =>
        lista.map((item) => (item.id === usuario.id ? { ...item, ativo } : item))
      );
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Não foi possível alterar o status do usuário.");
    } finally {
      setSalvandoId(null);
    }
  }

  async function cadastrarUsuario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nome = form.nome.trim();
    const email = form.email.trim();
    const senha = form.senha.trim();

    if (!nome || !email || !senha) {
      setErro("Preencha nome, e-mail e senha para cadastrar o usuário.");
      return;
    }

    try {
      setErro("");
      setSalvandoNovo(true);
      const res = await criarUsuario({
        nome,
        email,
        senha,
        perfil: form.perfil,
      });

      setForm(formularioInicial);
      await carregarUsuarios();
      setErro("");
      console.log("Usuário criado:", res);
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Não foi possível cadastrar o usuário.");
    } finally {
      setSalvandoNovo(false);
    }
  }

  return (
    <div className="pagina">
      <section className="card">
        <h2>Novo usuário</h2>

        <form onSubmit={cadastrarUsuario} style={{ display: "grid", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
            <label>
              Nome
              <input
                value={form.nome}
                onChange={(event) => setForm((estado) => ({ ...estado, nome: event.target.value }))}
                placeholder="Ex: João da Silva"
              />
            </label>

            <label>
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((estado) => ({ ...estado, email: event.target.value }))}
                placeholder="Ex: joao@empresa.com"
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={form.senha}
                onChange={(event) => setForm((estado) => ({ ...estado, senha: event.target.value }))}
                placeholder="Digite a senha"
              />
            </label>

            <label>
              Perfil
              <select
                value={form.perfil}
                onChange={(event) =>
                  setForm((estado) => ({ ...estado, perfil: event.target.value as Perfil }))
                }
              >
                {perfis.map((perfil) => (
                  <option key={perfil} value={perfil}>
                    {perfil}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primario" disabled={salvandoNovo}>
              {salvandoNovo ? "Cadastrando..." : "Cadastrar usuário"}
            </button>
          </div>
        </form>

        <h2>Gestão de usuários</h2>

        {erro && <p className="erro">{erro}</p>}

        {carregando ? (
          <p className="texto-suave">Carregando usuários...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>#{usuario.id}</td>
                  <td>{usuario.nome}</td>
                  <td>{usuario.email}</td>
                  <td>
                    {usuario.perfil === "GERENTE" ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "8px 12px",
                          borderRadius: 6,
                          background: "#f2f4f7",
                          color: "#344054",
                          fontWeight: 600,
                          width: "100%",
                          justifyContent: "center",
                        }}
                      >
                        GERENTE
                      </span>
                    ) : (
                      <select
                        value={usuario.perfil}
                        onChange={(event) => mudarPerfil(usuario.id, event.target.value as Perfil)}
                        disabled={salvandoId === usuario.id}
                      >
                        {perfis.map((perfil) => (
                          <option key={perfil} value={perfil}>
                            {perfil}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <span
                      className={usuario.ativo === false ? "texto-suave" : ""}
                      style={{
                        display: "inline-flex",
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: usuario.ativo === false ? "#eef1f5" : "#e8f5ee",
                        color: usuario.ativo === false ? "#475467" : "#027a48",
                        fontWeight: 600,
                      }}
                    >
                      {usuario.ativo === false ? "Inativo" : "Ativo"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secundario"
                      onClick={() => alternarAtivo(usuario)}
                      disabled={salvandoId === usuario.id || usuario.perfil === "GERENTE"}
                      title={usuario.perfil === "GERENTE" ? "Gerente não pode ser inativado" : "Alterar status"}
                    >
                      {usuario.perfil === "GERENTE"
                        ? "Bloqueado"
                        : usuario.ativo === false
                          ? "Ativar"
                          : "Inativar"}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={6} className="texto-suave">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
