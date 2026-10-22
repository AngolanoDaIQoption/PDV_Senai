import { useEffect, useState } from "react"; // Hooks do React para consultar o histórico e controlar filtros
import type { VendaHistorico } from "../types"; // Tipo do histórico de pedidos da loja
import { buscarVendas, cancelarVenda } from "../services/api"; // Requisições para consultar e cancelar vendas do sistema
import { formatarMoeda } from "../utils/format"; // Formatação em moeda para exibir o valor total da venda

function formatarFormaPagamento(forma: string): string {
  switch (forma) {
    case "DINHEIRO":
      return "Dinheiro";
    case "PIX":
      return "Pix";
    case "CARTAO_DEBITO":
      return "Cartão de Débito";
    case "CARTAO_CREDITO":
      return "Cartão de Crédito";
    default:
      return forma;
  }
}

function formatarDataHora(dataString?: string): string {
  if (!dataString) return "-";
  const data = new Date(dataString);
  if (isNaN(data.getTime())) return dataString;
  return data.toLocaleString("pt-BR");
}

export default function Vendas() {
  // O gerente consulta aqui o histórico de vendas e pode abrir os itens de cada compra, mesmo sem o caixa aberto.
  const [vendas, setVendas] = useState<VendaHistorico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [linhaExpandidaId, setLinhaExpandidaId] = useState<number | null>(null);
  const [vendaEmCancelamentoId, setVendaEmCancelamentoId] = useState<number | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState("Cancelamento autorizado pelo gerente");
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const usuario = JSON.parse(localStorage.getItem("usuario") ?? "null") as { perfil?: string } | null;
  const podeCancelarVenda = usuario?.perfil === "GERENTE";

  async function carregarVendas() {
    try {
      setCarregando(true);
      const dados = await buscarVendas();
      setVendas(dados);
      setErro("");
    } catch (err) {
      console.error(err);
      setErro("Não foi possível carregar o histórico de vendas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    // Carregamos o histórico uma vez ao abrir a tela.
    carregarVendas();
  }, []);

  function abrirModalCancelarVenda(id: number) {
    setVendaEmCancelamentoId(id);
    setMotivoCancelamento("Cancelamento autorizado pelo gerente");
    setErro("");
  }

  function fecharModalCancelamento() {
    setVendaEmCancelamentoId(null);
    setMotivoCancelamento("Cancelamento autorizado pelo gerente");
    setConfirmandoCancelamento(false);
    setErro("");
  }

  async function confirmarCancelamento() {
    if (vendaEmCancelamentoId === null) return;

    const motivoTrim = motivoCancelamento.trim();
    if (!motivoTrim) {
      setErro("O motivo do cancelamento é obrigatório.");
      return;
    }

    try {
      setConfirmandoCancelamento(true);
      setErro("");
      await cancelarVenda(vendaEmCancelamentoId, motivoTrim);
      fecharModalCancelamento();
      await carregarVendas();
    } catch (err) {
      console.error(err);
      setErro(err instanceof Error ? err.message : "Não foi possível cancelar a venda.");
    } finally {
      setConfirmandoCancelamento(false);
    }
  }

  function toggleExpandir(id: number) {
    setLinhaExpandidaId((atual) => (atual === id ? null : id));
  }

  // Cliente e data são filtros aplicados no navegador à lista já carregada.
  const termoCliente = buscaCliente.trim().toLowerCase();
  const vendasFiltradas = vendas.filter((v) => {
    const nomeCliente = (v.cliente_nome ?? "sem cliente").toLowerCase();
    const bateCliente = !termoCliente || nomeCliente.includes(termoCliente);

    let bateData = true;
    if (filtroData && v.data_venda) {
      const dataIso = new Date(v.data_venda).toISOString().slice(0, 10);
      bateData = dataIso === filtroData;
    }

    return bateCliente && bateData;
  });

  const totalVendas = vendasFiltradas.length;
  const faturamentoTotal = vendasFiltradas.reduce((soma, venda) => soma + Number(venda.valor_total || 0), 0);
  const ticketMedio = totalVendas > 0 ? faturamentoTotal / totalVendas : 0;
  const descontoMedio = totalVendas > 0
    ? vendasFiltradas.reduce((soma, venda) => soma + Number(venda.percentual_desconto || 0), 0) / totalVendas
    : 0;
  const maiorVenda = vendasFiltradas.reduce((maior, venda) => Math.max(maior, Number(venda.valor_total || 0)), 0);

  return (
    <div className="pagina">
      <div className="dashboard-header">
        <div>
          <h1>Histórico de Vendas</h1>
          <div className="dashboard-subtitle">Visão geral do desempenho comercial e pedidos da loja</div>
        </div>

        <div className="dashboard-toolbar">
          <button
            type="button"
            className="btn btn-secundario"
            onClick={() => {
              setBuscaCliente("");
              setFiltroData("");
            }}
            disabled={!buscaCliente && !filtroData}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="kpis-grid">
        <div className="kpi-card">
          <span className="kpi-label">Vendas</span>
          <span className="kpi-value">{totalVendas}</span>
          <div className="kpi-meta">
            <span className="texto-suave">Total no filtro</span>
            <span className="kpi-trend positivo">+12.4%</span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Faturamento</span>
          <span className="kpi-value">{formatarMoeda(faturamentoTotal)}</span>
          <div className="kpi-meta">
            <span className="texto-suave">Acumulado</span>
            <span className="kpi-trend positivo">+8.1%</span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Ticket Médio</span>
          <span className="kpi-value">{formatarMoeda(ticketMedio)}</span>
          <div className="kpi-meta">
            <span className="texto-suave">Por venda</span>
            <span className="kpi-trend positivo">+3.2%</span>
          </div>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Desconto Médio</span>
          <span className="kpi-value">{descontoMedio.toFixed(1)}%</span>
          <div className="kpi-meta">
            <span className="texto-suave">Maior venda</span>
            <span className="kpi-trend negativo">{formatarMoeda(maiorVenda)}</span>
          </div>
        </div>
      </div>

      <section className="card">
        <h2>Filtros do Histórico</h2>
        <div className="form-grid">
          <label className="largo">
            Buscar por cliente
            <input
              type="search"
              value={buscaCliente}
              onChange={(e) => setBuscaCliente(e.target.value)}
              placeholder="Digite o nome do cliente..."
            />
          </label>
          <label>
            Filtrar por data
            <input
              type="date"
              value={filtroData}
              onChange={(e) => setFiltroData(e.target.value)}
            />
          </label>
          <div className="linha" style={{ alignItems: "flex-end" }}>
            {(buscaCliente || filtroData) && (
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => {
                  setBuscaCliente("");
                  setFiltroData("");
                }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>
          {carregando
            ? "Carregando histórico de vendas..."
            : `Histórico de Vendas (${vendasFiltradas.length})`}
        </h2>

        {erro && <p className="erro">{erro}</p>}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Data/Hora</th>
              <th>Cliente</th>
              <th>Operador</th>
              <th>Pagamento</th>
              <th>Desconto</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {vendasFiltradas.map((v) => {
              const expandida = linhaExpandidaId === v.id;
              return (
                <tr key={`venda-wrapper-${v.id}`} style={{ borderBottom: "1px solid var(--borda)" }}>
                  <td colSpan={8} style={{ padding: 0 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "60px 1.2fr 1.5fr 1fr 1.2fr 90px 1.1fr 100px",
                        alignItems: "center",
                        padding: "10px 8px",
                        background: expandida ? "rgba(31, 78, 121, 0.05)" : "transparent",
                        opacity: v.status === "CANCELADA" ? 0.78 : 1,
                      }}
                    >
                      <span
                        style={{
                          textDecoration: v.status === "CANCELADA" ? "line-through" : "none",
                          textDecorationColor: "rgba(255, 124, 132, 0.9)",
                          textDecorationThickness: "2px",
                        }}
                      >
                        #{v.id}
                      </span>
                      <span
                        style={{
                          textDecoration: v.status === "CANCELADA" ? "line-through" : "none",
                          textDecorationColor: "rgba(255, 124, 132, 0.9)",
                          textDecorationThickness: "2px",
                        }}
                      >
                        {formatarDataHora(v.data_venda)}
                      </span>
                      <span
                        style={{
                          textDecoration: v.status === "CANCELADA" ? "line-through" : "none",
                          textDecorationColor: "rgba(255, 124, 132, 0.9)",
                          textDecorationThickness: "2px",
                        }}
                      >
                        {v.cliente_nome || <em className="texto-suave">Sem cliente</em>}
                      </span>
                      <span
                        style={{
                          textDecoration: v.status === "CANCELADA" ? "line-through" : "none",
                          textDecorationColor: "rgba(255, 124, 132, 0.9)",
                          textDecorationThickness: "2px",
                        }}
                      >
                        {v.usuario_nome || `Operador #${v.usuario_id}`}
                      </span>
                      <span
                        style={{
                          textDecoration: v.status === "CANCELADA" ? "line-through" : "none",
                          textDecorationColor: "rgba(255, 124, 132, 0.9)",
                          textDecorationThickness: "2px",
                        }}
                      >
                        {formatarFormaPagamento(v.forma_pagamento)}
                      </span>
                      <span
                        style={{
                          textDecoration: v.status === "CANCELADA" ? "line-through" : "none",
                          textDecorationColor: "rgba(255, 124, 132, 0.9)",
                          textDecorationThickness: "2px",
                        }}
                      >
                        {v.percentual_desconto}%
                      </span>
                      <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <strong
                          style={{
                            color: v.status === "CANCELADA" ? "rgba(255,255,255,0.5)" : "inherit",
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          {formatarMoeda(v.valor_total)}
                          {v.status === "CANCELADA" && (
                            <span
                              style={{
                                position: "absolute",
                                left: "0",
                                right: "0",
                                top: "50%",
                                height: "2px",
                                background: "rgba(255, 124, 132, 0.9)",
                                borderRadius: "999px",
                                transform: "translateY(-50%)",
                              }}
                            />
                          )}
                        </strong>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-secundario"
                          style={{ padding: "5px 10px", fontSize: "0.85rem" }}
                          onClick={() => toggleExpandir(v.id)}
                        >
                          {expandida ? "Recolher" : "Detalhes"}
                        </button>
                      </div>
                    </div>

                    {expandida && (
                      <div
                        style={{
                          padding: "14px 18px",
                          background: "var(--fundo)",
                          borderTop: "1px dashed var(--borda)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "20px",
                            marginBottom: "12px",
                            fontSize: "0.9rem",
                          }}
                        >
                          <span>
                            <strong>Subtotal:</strong> {formatarMoeda(v.valor_subtotal)}
                          </span>
                          <span>
                            <strong>Desconto aplicado:</strong> − {formatarMoeda(v.valor_desconto)} ({v.percentual_desconto}%)
                          </span>
                          <span>
                            <strong>Status:</strong>{" "}
                            <span style={{ color: v.status === "CANCELADA" ? "var(--perigo)" : "#027a48", fontWeight: 600 }}>
                              {v.status}
                            </span>
                          </span>
                          {v.autorizado_por_nome && (
                            <span>
                              <strong>Autorizado por:</strong> {v.autorizado_por_nome}
                            </span>
                          )}
                          {v.cancelado_por_nome && (
                            <span>
                              <strong>Cancelado por:</strong> {v.cancelado_por_nome} (Motivo: {v.motivo_cancelamento ?? "Não informado"})
                            </span>
                          )}
                        </div>

                        {v.status !== "CANCELADA" && podeCancelarVenda && (
                          <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="btn btn-secundario"
                              onClick={() => abrirModalCancelarVenda(v.id)}
                              style={{ padding: "6px 12px" }}
                            >
                              Cancelar venda
                            </button>
                          </div>
                        )}

                        <h4 style={{ margin: "10px 0 6px", fontSize: "0.95rem" }}>
                          Itens Comprados ({v.itens?.length ?? 0})
                        </h4>

                        {v.itens && v.itens.length > 0 ? (
                          <table style={{ margin: 0, background: "var(--superficie)", border: "1px solid var(--borda)" }}>
                            <thead>
                              <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Preço Unitário Histórico</th>
                                <th>Subtotal do Item</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.itens.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.produto_descricao || `Produto #${item.produto_id}`}</td>
                                  <td>{item.quantidade}</td>
                                  <td>{formatarMoeda(item.preco_unitario)}</td>
                                  <td>{formatarMoeda(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="texto-suave" style={{ margin: "4px 0" }}>
                            Nenhum item registrado para esta venda.
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {vendasFiltradas.length === 0 && !carregando && (
              <tr>
                <td colSpan={8} className="texto-suave" style={{ padding: "16px 8px" }}>
                  Nenhuma venda encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {vendaEmCancelamentoId !== null && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(4, 12, 22, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "540px",
              borderRadius: "14px",
              boxShadow: "0 22px 50px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <h3 style={{ margin: 0 }}>Cancelar venda</h3>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={fecharModalCancelamento}
                style={{ padding: "6px 10px", minWidth: "auto" }}
              >
                ×
              </button>
            </div>

            <p className="texto-suave" style={{ margin: "0 0 12px", lineHeight: 1.5 }}>
              Informe o motivo do cancelamento desta venda para registrar a operação com segurança.
            </p>

            <textarea
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              rows={4}
              placeholder="Ex.: Venda cancelada por solicitação do gerente."
              style={{
                width: "100%",
                resize: "vertical",
                borderRadius: "10px",
                border: "1px solid var(--borda)",
                background: "rgba(10, 19, 31, 0.65)",
                color: "var(--texto)",
                padding: "12px 14px",
                fontSize: "0.96rem",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />

            {erro && <p className="erro" style={{ marginTop: "10px" }}>{erro}</p>}

            <div className="linha" style={{ justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button type="button" className="btn btn-secundario" onClick={fecharModalCancelamento}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primario" onClick={confirmarCancelamento} disabled={confirmandoCancelamento}>
                {confirmandoCancelamento ? "Cancelando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
