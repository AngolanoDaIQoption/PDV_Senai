import { useEffect, useState } from "react"; // Hooks do React para carregar dados e controlar estados do formulário
import type { Perfil, Usuario } from "../types"; // Tipos do domínio de usuários e perfis do sistema
import { atualizarUsuario, buscarUsuarios, criarUsuario } from "../services/api"; // Funções da API para consultar e manipular usuários

// Lista de cargos que o gerente pode atribuir no cadastro de usuários.
const perfis: Perfil[] = ["CAIXA", "SUPERVISOR"];
const formularioInicial = {
  nome: "",
  email: "",
  senha: "",
  perfil: "CAIXA" as Perfil,
};

// A gestão de contas é reservada ao gerente; aqui ele cadastra usuários e ajusta seus acessos.
export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [form, setForm] = useState(formularioInicial);
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const usuariosAtivos = usuarios.filter((usuario) => usuario.ativo !== false).length;
  const totalGerentes = usuarios.filter((usuario) => usuario.perfil === "GERENTE").length;

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
    // Mantemos a proteção também na interface, além da regra que existe no servidor.
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

    // Removemos espaços acidentais antes de enviar os dados para a API.
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <p className="texto-suave" style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.75rem" }}>
              Gestão de acessos
            </p>
            <h2 style={{ marginTop: 6 }}>Novo usuário</h2>
          </div>
          <div className="summary-inline">
            <span>{usuarios.length} total</span>
            <span>{usuariosAtivos} ativos</span>
            <span>{totalGerentes} gerentes</span>
          </div>
        </div>

        <form
          onSubmit={cadastrarUsuario}
          autoComplete="off"
          style={{ display: "grid", gap: 12, marginBottom: 24 }}
        >
          <div className="form-grid">
            <label>
              Nome
              <input
                value={form.nome}
                onChange={(event) => setForm((estado) => ({ ...estado, nome: event.target.value }))}
                placeholder="Ex: João da Silva"
                autoComplete="off"
              />
            </label>

            <label>
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((estado) => ({ ...estado, email: event.target.value }))}
                placeholder="Ex: joao@empresa.com"
                autoComplete="off"
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={form.senha}
                onChange={(event) => setForm((estado) => ({ ...estado, senha: event.target.value }))}
                placeholder="Digite a senha"
                autoComplete="new-password"
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

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
            <span className="texto-suave" style={{ fontSize: "0.8rem" }}>Perfis permitidos: CAIXA e SUPERVISOR</span>
            <button type="submit" className="btn btn-primario" disabled={salvandoNovo}>
              {salvandoNovo ? "Cadastrando..." : "Cadastrar usuário"}
            </button>
          </div>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Gestão de usuários</h2>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={carregarUsuarios}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar lista"}
          </button>
        </div>

        {erro && <p className="erro">{erro}</p>}

        {carregando ? (
          <div className="empty-state">
            <p>Carregando usuários...</p>
          </div>
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
                      <span className="perfil-badge perfil-gerente">GERENTE</span>
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
                      className={usuario.ativo === false ? "status-badge status-inativo" : "status-badge status-ativo"}
                    >
                      {usuario.ativo === false ? "Inativo" : "Ativo"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`btn ${usuario.perfil === "GERENTE" ? "btn-secundario" : usuario.ativo === false ? "btn-primario" : "btn-secundario"}`}
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
                  <td colSpan={6}>
                    <div className="empty-state empty-state-table">
                      <p>Nenhum usuário encontrado.</p>
                    </div>
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