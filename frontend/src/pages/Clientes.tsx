import { useEffect, useState, type FormEvent } from "react";
import type { Cliente } from "../types";
import { buscarClientes, criarCliente, atualizarCliente } from "../services/api";
import { mascararCpf, mascararTelefone, validarCpf } from "../utils/format";

const formVazio = { nome: "", cpf: "", telefone: "", email: "" };

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState(formVazio);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarClientes() {
    try {
      const dados = await buscarClientes();
      setClientes(dados);
      setErro("");
    } catch (err) {
      console.error(err);
      setErro("Não foi possível carregar os clientes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarClientes()
      .then((dados) => {
        setClientes(dados);
        setErro("");
      })
      .catch((err) => {
        console.error(err);
        setErro("Não foi possível carregar os clientes.");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  function atualizar(campo: keyof typeof formVazio, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function cancelarEdicao() {
    setForm(formVazio);
    setEditandoId(null);
    setErro("");
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();

    const nome = form.nome.trim();
    const cpfLimpo = form.cpf.replace(/\D/g, "");

    if (!nome) {
      setErro("Informe o nome do cliente.");
      return;
    }
    if (!validarCpf(cpfLimpo)) {
      setErro("CPF inválido.");
      return;
    }
    if (clientes.some((c) => c.cpf.replace(/\D/g, "") === cpfLimpo && c.id !== editandoId)) {
      setErro("Já existe um cliente cadastrado com esse CPF.");
      return;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      setErro("Informe um e-mail válido ou deixe o campo vazio.");
      return;
    }

    try {
      if (editandoId !== null) {
        // Na edição, envia apenas os campos permitidos
        await atualizarCliente(editandoId, {
          nome,
          telefone: form.telefone,
          email: form.email,
        });
      } else {
        // No cadastro, envia o CPF somente com dígitos (CHAR(11))
        await criarCliente({
          nome,
          cpf: cpfLimpo,
          telefone: form.telefone,
          email: form.email,
        });
      }

      await carregarClientes();
      cancelarEdicao();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar cliente.");
    }
  }

  function editar(c: Cliente) {
    setEditandoId(c.id);
    setErro("");
    setForm({
      nome: c.nome,
      cpf: mascararCpf(c.cpf),
      telefone: mascararTelefone(c.telefone),
      email: c.email,
    });
  }

  return (
    <div className="pagina">
      <section className="card">
        <h2>{editandoId !== null ? "Editar cliente" : "Novo cliente"}</h2>

        <form className="form-grid" onSubmit={salvar}>
          <label className="largo">
            Nome
            <input value={form.nome} onChange={(e) => atualizar("nome", e.target.value)} />
          </label>
          <label>
            CPF
            <input
              value={form.cpf}
              onChange={(e) => atualizar("cpf", mascararCpf(e.target.value))}
              placeholder="000.000.000-00"
              disabled={editandoId !== null}
            />
          </label>
          <label>
            Telefone
            <input
              value={form.telefone}
              onChange={(e) => atualizar("telefone", mascararTelefone(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </label>
          <label className="largo">
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(e) => atualizar("email", e.target.value)}
            />
          </label>

          <div className="linha acoes-form">
            {editandoId !== null && (
              <button type="button" className="btn btn-secundario" onClick={cancelarEdicao}>
                Cancelar
              </button>
            )}
            <button type="submit" className="btn btn-primario">
              {editandoId !== null ? "Salvar alterações" : "Cadastrar cliente"}
            </button>
          </div>
        </form>

        {erro && <p className="erro">{erro}</p>}
      </section>

      <section className="card">
        <h2>{carregando ? "Carregando clientes..." : `Clientes cadastrados (${clientes.length})`}</h2>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id}>
                <td>{c.nome}</td>
                <td>{mascararCpf(c.cpf)}</td>
                <td>{mascararTelefone(c.telefone)}</td>
                <td>{c.email}</td>
                <td>
                  <div className="linha">
                    <button className="btn btn-secundario" onClick={() => editar(c)}>
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && !carregando && (
              <tr>
                <td colSpan={5} className="texto-suave">
                  Nenhum cliente cadastrado. Use o formulário acima para começar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}