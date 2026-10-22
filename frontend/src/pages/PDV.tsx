import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  Clock,
  Lock,
  Minus,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  Unlock,
  UserPlus,
  X,
} from "lucide-react";
import type { Cliente, FormaPagamento, ItemCarrinho, Produto, Usuario } from "../types";
import { ApiError, buscarClientes, buscarProdutos, criarCliente, criarVenda, login } from "../services/api";
import { formatarMoeda, mascararCpf, mascararTelefone, validarCpf } from "../utils/format";
import ModalAutorizacaoGerente from "../components/ModalAutorizacaoGerente";

const LIMITE_DESCONTO_CAIXA = 10;

export default function PDV() {
  const usuario: Usuario | null = JSON.parse(localStorage.getItem("usuario") ?? "null");
  const ehGerente = usuario?.perfil === "GERENTE";

  // ---------------------------------------------------------
  // 1. CONTROLE DE CAIXA (Abertura e Fechamento)
  // ---------------------------------------------------------
  const [caixaAberto, setCaixaAberto] = useState<boolean>(() => {
    return localStorage.getItem("pdv_caixa_aberto") === "true";
  });
  const [fundoTroco, setFundoTroco] = useState<number>(() => {
    const salvo = localStorage.getItem("pdv_fundo_troco");
    return salvo ? Number(salvo) : 0;
  });
  const [vendasDinheiroTurno, setVendasDinheiroTurno] = useState<number>(() => {
    const salvo = localStorage.getItem("pdv_vendas_dinheiro_turno");
    return salvo ? Number(salvo) : 0;
  });
  const [vendasTotalTurno, setVendasTotalTurno] = useState<number>(() => {
    const salvo = localStorage.getItem("pdv_vendas_total_turno");
    return salvo ? Number(salvo) : 0;
  });
  const [qtdVendasTurno, setQtdVendasTurno] = useState<number>(() => {
    const salvo = localStorage.getItem("pdv_qtd_vendas_turno");
    return salvo ? Number(salvo) : 0;
  });
  const [valorConferenciaTexto, setValorConferenciaTexto] = useState<string>("");
  const [solicitandoAbertura, setSolicitandoAbertura] = useState<boolean>(false);
  const [inputFundoTroco, setInputFundoTroco] = useState<string>("");
  const [menuAcoesAberto, setMenuAcoesAberto] = useState<boolean>(false);
  const [modalFecharCaixa, setModalFecharCaixa] = useState<boolean>(false);
  const [dataHoraAtual, setDataHoraAtual] = useState<Date>(new Date());

  // Relógio atualizado em tempo real para o balcão
  useEffect(() => {
    const timer = setInterval(() => {
      setDataHoraAtual(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleIniciarAbertura() {
    setInputFundoTroco(fundoTroco > 0 ? String(fundoTroco) : "");
    setSolicitandoAbertura(true);
  }

  function handleConfirmarAberturaCaixa(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const valor = Number(inputFundoTroco.replace(",", ".")) || 0;
    if (valor < 0) {
      exibirToast("O valor do fundo de troco não pode ser negativo.", "erro");
      return;
    }
    setFundoTroco(valor);
    setCaixaAberto(true);
    setSolicitandoAbertura(false);
    localStorage.setItem("pdv_caixa_aberto", "true");
    localStorage.setItem("pdv_fundo_troco", String(valor));
    exibirToast(`Caixa aberto com sucesso! Fundo: ${formatarMoeda(valor)}`, "sucesso");
  }

  // Saldo esperado em caixa na gaveta (fundo inicial + entradas em dinheiro)
  const saldoEsperado = (Math.round(fundoTroco * 100) + Math.round(vendasDinheiroTurno * 100)) / 100;
  const valorInformadoNum = Number(valorConferenciaTexto.replace(",", ".")) || 0;
  const temValorInformado = valorConferenciaTexto.trim() !== "";
  const diferencaConferencia = temValorInformado
    ? (Math.round(valorInformadoNum * 100) - Math.round(saldoEsperado * 100)) / 100
    : 0;
  const diferencaAbs = Math.abs(diferencaConferencia);
  const conferidoAprovado = temValorInformado && diferencaAbs <= 2.0001;

  function handleFecharCaixa() {
    setCaixaAberto(false);
    setFundoTroco(0);
    setVendasDinheiroTurno(0);
    setVendasTotalTurno(0);
    setQtdVendasTurno(0);
    setValorConferenciaTexto("");
    setSolicitandoAbertura(false);
    setMenuAcoesAberto(false);
    setModalFecharCaixa(false);
    limparVenda();
    localStorage.removeItem("pdv_caixa_aberto");
    localStorage.removeItem("pdv_fundo_troco");
    localStorage.removeItem("pdv_vendas_dinheiro_turno");
    localStorage.removeItem("pdv_vendas_total_turno");
    localStorage.removeItem("pdv_qtd_vendas_turno");
    exibirToast("Caixa conferido e fechado com sucesso.", "info");
  }

  // ---------------------------------------------------------
  // 2. DADOS E CATÁLOGO DE PRODUTOS
  // ---------------------------------------------------------
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregandoDados, setCarregandoDados] = useState<boolean>(false);

  useEffect(() => {
    setCarregandoDados(true);
    Promise.all([buscarProdutos(), buscarClientes()])
      .then(([listaProdutos, listaClientes]) => {
        setProdutos(listaProdutos);
        setClientes(listaClientes);
      })
      .catch((err) => {
        console.error("Erro ao carregar catálogo do PDV:", err);
        exibirToast("Não foi possível carregar os dados do PDV.", "erro");
      })
      .finally(() => setCarregandoDados(false));
  }, []);

  // ---------------------------------------------------------
  // 3. BUSCA DE PRODUTOS (Com Dropdown de Sugestões e Leitor de Barras)
  // ---------------------------------------------------------
  const [termoBusca, setTermoBusca] = useState<string>("");
  const [quantidadeBusca, setQuantidadeBusca] = useState<number>(1);
  const [dropdownAberto, setDropdownAberto] = useState<boolean>(false);
  const [itemSelecionadoIndex, setItemSelecionadoIndex] = useState<number>(0);

  const inputBuscaRef = useRef<HTMLInputElement>(null);
  const buscaContainerRef = useRef<HTMLDivElement>(null);
  const menuAcoesRef = useRef<HTMLDivElement>(null);

  // Foco automático no input de busca sempre que o caixa estiver aberto
  useEffect(() => {
    if (caixaAberto && !solicitandoAbertura && !modalFecharCaixa) {
      inputBuscaRef.current?.focus();
    }
  }, [caixaAberto, solicitandoAbertura, modalFecharCaixa]);

  // Toast temporário de feedback
  const [toast, setToast] = useState<{
    mensagem: string;
    tipo: "sucesso" | "erro" | "info";
  } | null>(null);

  function exibirToast(mensagem: string, tipo: "sucesso" | "erro" | "info" = "info") {
    setToast({ mensagem, tipo });
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Fecha o menu de Mais Ações ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuAcoesRef.current && !menuAcoesRef.current.contains(event.target as Node)) {
        setMenuAcoesAberto(false);
      }
      if (buscaContainerRef.current && !buscaContainerRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sugestões preditivas para o Dropdown (começam com o termo ou contêm o termo)
  const termoNormalizado = termoBusca.trim().toLowerCase();
  const produtosSugeridos = useMemo(() => {
    if (!termoNormalizado) return [];

    // 1. Prioriza produtos que COMEÇAM com o termo (na descrição ou no código)
    const comecamCom = produtos.filter(
      (p) =>
        p.descricao.toLowerCase().startsWith(termoNormalizado) ||
        p.codigo.toLowerCase().startsWith(termoNormalizado)
    );

    // 2. Secundariamente, produtos que CONTÊM o termo em qualquer parte
    const contem = produtos.filter(
      (p) =>
        !comecamCom.some((item) => item.id === p.id) &&
        (p.descricao.toLowerCase().includes(termoNormalizado) ||
          p.codigo.toLowerCase().includes(termoNormalizado))
    );

    return [...comecamCom, ...contem].slice(0, 8);
  }, [produtos, termoNormalizado]);

  // ---------------------------------------------------------
  // 4. CARRINHO ("Venda atual") E FINALIZAÇÃO
  // ---------------------------------------------------------
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [tipoDesconto, setTipoDesconto] = useState<"percentual" | "valor">("percentual");
  const [descontoTexto, setDescontoTexto] = useState<string>("");
  const [clienteId, setClienteId] = useState<string>("");
  const [pagamento, setPagamento] = useState<FormaPagamento>("DINHEIRO");
  const [valorRecebidoTexto, setValorRecebidoTexto] = useState<string>("");

  const [modalNovoClienteAberto, setModalNovoClienteAberto] = useState<boolean>(false);
  const [novoClienteForm, setNovoClienteForm] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
  });
  const [salvandoCliente, setSalvandoCliente] = useState<boolean>(false);
  const [erroCliente, setErroCliente] = useState<string>("");

  const [modalGerenteAberto, setModalGerenteAberto] = useState<boolean>(false);
  const [salvando, setSalvando] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>("");
  const [mensagemErro, setMensagemErro] = useState<string>("");

  // Adição limpa e reutilizável de produto ao carrinho
  function adicionarProdutoAoCarrinho(produto: Produto, quantidade: number = 1): boolean {
    const qtd = Math.max(1, Number(quantidade) || 1);
    const itemExistente = carrinho.find((i) => i.produto.id === produto.id);
    const qtdAtual = itemExistente ? itemExistente.quantidade : 0;
    const qtdTotalDesejada = qtdAtual + qtd;

    if (produto.estoque < 1) {
      exibirToast(`Produto "${produto.descricao}" está sem estoque.`, "erro");
      inputBuscaRef.current?.select();
      return false;
    }

    if (qtdTotalDesejada > produto.estoque) {
      const disponivel = Math.max(0, produto.estoque - qtdAtual);
      exibirToast(
        `Estoque insuficiente para "${produto.descricao}". Disponível: ${disponivel} un.`,
        "erro"
      );
      inputBuscaRef.current?.select();
      return false;
    }

    setCarrinho((atual) => {
      if (itemExistente) {
        return atual.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + qtd }
            : item
        );
      }
      return [{ produto, quantidade: qtd }, ...atual];
    });

    exibirToast(
      `+ ${qtd}x ${produto.descricao} (${formatarMoeda(produto.preco * qtd)})`,
      "sucesso"
    );

    setTermoBusca("");
    setQuantidadeBusca(1);
    setDropdownAberto(false);
    setItemSelecionadoIndex(0);
    inputBuscaRef.current?.focus();
    return true;
  }

  // Função disparada ao bipar ou apertar Enter no campo de busca
  function processarLeituraProduto() {
    const termo = termoBusca.trim().toLowerCase();
    if (!termo) return;

    // Se o dropdown de sugestões estiver aberto e com itens, usa o selecionado
    if (dropdownAberto && produtosSugeridos.length > 0) {
      const selecionado = produtosSugeridos[itemSelecionadoIndex] || produtosSugeridos[0];
      if (selecionado) {
        adicionarProdutoAoCarrinho(selecionado, quantidadeBusca);
        return;
      }
    }

    // 1. Busca prioritária por código/SKU idêntico (leitor de código de barras)
    let encontrado = produtos.find(
      (p) => p.codigo.trim().toLowerCase() === termo
    );

    // 2. Busca secundária por prefixo de código
    if (!encontrado) {
      encontrado = produtos.find((p) =>
        p.codigo.trim().toLowerCase().startsWith(termo)
      );
    }

    // 3. Busca por prefixo de descrição
    if (!encontrado) {
      encontrado = produtos.find((p) =>
        p.descricao.trim().toLowerCase().startsWith(termo)
      );
    }

    // 4. Busca por descrição textual
    if (!encontrado) {
      encontrado = produtos.find((p) =>
        p.descricao.trim().toLowerCase().includes(termo)
      );
    }

    if (!encontrado) {
      exibirToast(`Produto não encontrado para o código: "${termoBusca}"`, "erro");
      inputBuscaRef.current?.select();
      return;
    }

    adicionarProdutoAoCarrinho(encontrado, quantidadeBusca);
  }

  // Tratamento de teclas de navegação no input de busca (Setas Cima/Baixo, Enter, Esc)
  function handleKeyDownBusca(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (produtosSugeridos.length > 0) {
        setDropdownAberto(true);
        setItemSelecionadoIndex((prev) => (prev + 1) % produtosSugeridos.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (produtosSugeridos.length > 0) {
        setDropdownAberto(true);
        setItemSelecionadoIndex((prev) => (prev - 1 + produtosSugeridos.length) % produtosSugeridos.length);
      }
      return;
    }

    if (e.key === "Escape") {
      if (dropdownAberto) {
        e.preventDefault();
        setDropdownAberto(false);
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (dropdownAberto && produtosSugeridos.length > 0) {
        const selecionado = produtosSugeridos[itemSelecionadoIndex] || produtosSugeridos[0];
        if (selecionado) {
          adicionarProdutoAoCarrinho(selecionado, quantidadeBusca);
          return;
        }
      }
      processarLeituraProduto();
    }
  }

  function alterarQuantidade(id: number, delta: number) {
    setMensagemErro("");
    setMensagemSucesso("");
    setCarrinho((atual) =>
      atual
        .map((i) => {
          if (i.produto.id !== id) return i;
          const novaQtd = i.quantidade + delta;
          if (novaQtd > i.produto.estoque) {
            exibirToast(`Estoque máximo atingido (${i.produto.estoque} un).`, "erro");
            return i;
          }
          return { ...i, quantidade: Math.max(0, novaQtd) };
        })
        .filter((i) => i.quantidade > 0)
    );
  }

  function removerItem(id: number) {
    setMensagemErro("");
    setMensagemSucesso("");
    setCarrinho((atual) => atual.filter((i) => i.produto.id !== id));
  }

  // Cálculos financeiros em centavos para precisão
  const subtotalCentavos = carrinho.reduce((soma, i) => {
    const precoItemCentavos = Math.round(i.produto.preco * 100);
    return soma + precoItemCentavos * i.quantidade;
  }, 0);
  const subtotal = subtotalCentavos / 100;

  const descontoDigitado = Number(descontoTexto.replace(",", ".")) || 0;
  const descontoCalculadoCentavos =
    tipoDesconto === "percentual"
      ? Math.round((subtotalCentavos * descontoDigitado) / 100)
      : Math.round(descontoDigitado * 100);
  const valorDescontoCentavos = Math.max(0, Math.min(descontoCalculadoCentavos, subtotalCentavos));

  const valorDesconto = valorDescontoCentavos / 100;
  const percentualEfetivo =
    subtotalCentavos > 0 ? (valorDescontoCentavos / subtotalCentavos) * 100 : 0;

  const totalCentavos = subtotalCentavos - valorDescontoCentavos;
  const total = totalCentavos / 100;

  // Cálculo de troco para pagamento em dinheiro
  const valorRecebido = Number(valorRecebidoTexto.replace(",", ".")) || 0;
  const troco = pagamento === "DINHEIRO" && valorRecebido > total ? valorRecebido - total : 0;

  // Autorização necessária se desconto > 10% e o operador não for gerente
  const exigeAutorizacao = !ehGerente && percentualEfetivo > LIMITE_DESCONTO_CAIXA;

  function limparVenda() {
    setCarrinho([]);
    setDescontoTexto("");
    setClienteId("");
    setPagamento("DINHEIRO");
    setValorRecebidoTexto("");
    setTermoBusca("");
    setQuantidadeBusca(1);
    setDropdownAberto(false);
    setMensagemErro("");
    setMensagemSucesso("");
    inputBuscaRef.current?.focus();
  }

  async function executarFinalizacao(tokenGerente?: string): Promise<boolean> {
    setSalvando(true);
    setMensagemErro("");

    try {
      const venda = await criarVenda(
        {
          cliente_id: clienteId ? Number(clienteId) : null,
          valor_desconto: valorDesconto,
          forma_pagamento: pagamento,
          itens: carrinho.map(({ produto, quantidade }) => ({
            produto_id: produto.id,
            quantidade,
          })),
        },
        tokenGerente
      );

      // Atualiza o estoque local com a baixa realizada
      setProdutos((atuais) =>
        atuais.map((produto) => {
          const vendido = carrinho.find((item) => item.produto.id === produto.id);
          return vendido
            ? { ...produto, estoque: produto.estoque - vendido.quantidade }
            : produto;
        })
      );

      // Atualiza os acumuladores do turno de caixa
      const totalVendaFinalizada = Number(venda.valor_total) || total;
      setVendasTotalTurno((prev) => {
        const novo = (Math.round(prev * 100) + Math.round(totalVendaFinalizada * 100)) / 100;
        localStorage.setItem("pdv_vendas_total_turno", String(novo));
        return novo;
      });
      setQtdVendasTurno((prev) => {
        const novo = prev + 1;
        localStorage.setItem("pdv_qtd_vendas_turno", String(novo));
        return novo;
      });
      if (pagamento === "DINHEIRO") {
        setVendasDinheiroTurno((prev) => {
          const novo = (Math.round(prev * 100) + Math.round(totalVendaFinalizada * 100)) / 100;
          localStorage.setItem("pdv_vendas_dinheiro_turno", String(novo));
          return novo;
        });
      }

      const msg = `${venda.message} Total: ${formatarMoeda(venda.valor_total)}`;
      setMensagemSucesso(msg);
      exibirToast(msg, "sucesso");
      setMensagemErro("");
      setModalGerenteAberto(false);
      limparVenda();
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.code === "MANAGER_AUTH_REQUIRED") {
        setModalGerenteAberto(true);
        return false;
      }
      const msg = error instanceof Error ? error.message : "Não foi possível finalizar a venda.";
      setMensagemErro(msg);
      exibirToast(msg, "erro");
      return false;
    } finally {
      setSalvando(false);
    }
  }

  async function finalizar() {
    if (salvando || modalGerenteAberto) return;
    setMensagemSucesso("");
    setMensagemErro("");

    if (carrinho.length === 0) {
      const msg = "Adicione ao menos um produto para finalizar a venda.";
      setMensagemErro(msg);
      exibirToast(msg, "erro");
      return;
    }

    if (exigeAutorizacao) {
      setModalGerenteAberto(true);
      return;
    }

    await executarFinalizacao();
  }

  async function onAutorizarGerente(email: string, senha: string) {
    const resposta = await login(email, senha);
    if (resposta.usuario.perfil !== "GERENTE") {
      throw new Error("A conta informada não tem perfil de gerente.");
    }
    const finalizada = await executarFinalizacao(resposta.token);
    if (!finalizada) {
      throw new Error("A venda não foi concluída. Confira as mensagens e tente novamente.");
    }
  }

  async function handleSalvarNovoCliente(e: React.FormEvent) {
    e.preventDefault();
    const nome = novoClienteForm.nome.trim();
    const cpfLimpo = novoClienteForm.cpf.replace(/\D/g, "");

    if (!nome) {
      setErroCliente("Informe o nome do cliente.");
      return;
    }
    if (!validarCpf(cpfLimpo)) {
      setErroCliente("CPF inválido. Verifique os números digitados.");
      return;
    }
    if (clientes.some((c) => c.cpf.replace(/\D/g, "") === cpfLimpo)) {
      setErroCliente("Já existe um cliente cadastrado com esse CPF.");
      return;
    }
    if (novoClienteForm.email && !/^\S+@\S+\.\S+$/.test(novoClienteForm.email)) {
      setErroCliente("Informe um e-mail válido ou deixe o campo vazio.");
      return;
    }

    try {
      setSalvandoCliente(true);
      setErroCliente("");
      const resposta = await criarCliente({
        nome,
        cpf: cpfLimpo,
        telefone: novoClienteForm.telefone,
        email: novoClienteForm.email,
      });

      const novoCliente: Cliente = {
        id: resposta.id,
        nome,
        cpf: cpfLimpo,
        telefone: novoClienteForm.telefone,
        email: novoClienteForm.email,
      };

      setClientes((prev) => [novoCliente, ...prev]);
      setClienteId(String(resposta.id));
      setModalNovoClienteAberto(false);
      setNovoClienteForm({ nome: "", cpf: "", telefone: "", email: "" });
      exibirToast(`Cliente "${nome}" cadastrado e vinculado à venda!`, "sucesso");
    } catch (err) {
      console.error(err);
      setErroCliente(err instanceof Error ? err.message : "Erro ao cadastrar cliente.");
    } finally {
      setSalvandoCliente(false);
    }
  }

  // ---------------------------------------------------------
  // 5. ATALHOS DE TECLADO (Enter, F2, ESC)
  // ---------------------------------------------------------
  const finalizarRef = useRef(finalizar);
  const limparVendaRef = useRef(limparVenda);
  const modalGerenteAbertoRef = useRef(modalGerenteAberto);
  const modalFecharCaixaRef = useRef(modalFecharCaixa);
  const modalNovoClienteAbertoRef = useRef(modalNovoClienteAberto);
  const solicitandoAberturaRef = useRef(solicitandoAbertura);
  const menuAcoesAbertoRef = useRef(menuAcoesAberto);

  useEffect(() => {
    finalizarRef.current = finalizar;
    limparVendaRef.current = limparVenda;
    modalGerenteAbertoRef.current = modalGerenteAberto;
    modalFecharCaixaRef.current = modalFecharCaixa;
    modalNovoClienteAbertoRef.current = modalNovoClienteAberto;
    solicitandoAberturaRef.current = solicitandoAbertura;
    menuAcoesAbertoRef.current = menuAcoesAberto;
  });

  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      // F2: Finaliza a venda
      if (e.key === "F2") {
        e.preventDefault();
        if (caixaAberto) {
          finalizarRef.current();
        }
      }

      // ESC: Cancela a venda ou fecha modais
      if (e.key === "Escape") {
        if (menuAcoesAbertoRef.current) {
          e.preventDefault();
          setMenuAcoesAberto(false);
          return;
        }
        if (modalFecharCaixaRef.current) {
          e.preventDefault();
          setModalFecharCaixa(false);
          return;
        }
        if (modalNovoClienteAbertoRef.current) {
          e.preventDefault();
          setModalNovoClienteAberto(false);
          return;
        }
        if (modalGerenteAbertoRef.current) {
          e.preventDefault();
          setModalGerenteAberto(false);
          return;
        }
        if (solicitandoAberturaRef.current) {
          e.preventDefault();
          setSolicitandoAbertura(false);
          return;
        }
        if (dropdownAberto) {
          e.preventDefault();
          setDropdownAberto(false);
          return;
        }
        // Se houver texto no input de busca, limpa
        if (termoBusca) {
          e.preventDefault();
          setTermoBusca("");
          return;
        }
        // Se houver carrinho, cancela a venda
        if (carrinho.length > 0) {
          e.preventDefault();
          limparVendaRef.current();
          exibirToast("Venda cancelada.", "info");
        }
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [caixaAberto, termoBusca, carrinho.length, dropdownAberto]);

  // Formatações de exibição de data e hora
  const horaFormatada = dataHoraAtual.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dataFormatada = dataHoraAtual.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // =========================================================
  // RENDERIZAÇÃO: SE O CAIXA ESTIVER FECHADO
  // =========================================================
  if (!caixaAberto) {
    return (
      <div
        className="pagina"
        style={{
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Toast Notifier */}
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "24px",
              right: "24px",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 18px",
              borderRadius: "10px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              color: "#fff",
              background:
                toast.tipo === "erro"
                  ? "var(--perigo)"
                  : toast.tipo === "sucesso"
                  ? "var(--sucesso)"
                  : "var(--primaria)",
              fontWeight: 500,
              fontSize: "0.92rem",
            }}
          >
            {toast.tipo === "erro" && <AlertCircle size={18} />}
            {toast.tipo === "sucesso" && <CheckCircle2 size={18} />}
            {toast.tipo === "info" && <Clock size={18} />}
            <span>{toast.mensagem}</span>
          </div>
        )}

        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: "460px",
            textAlign: "center",
            padding: "36px 30px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {/* Ícone de status */}
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "rgba(148, 163, 184, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--texto-suave)",
            }}
          >
            <Lock size={28} />
          </div>

          {/* Relógio em destaque */}
          <div>
            <div
              style={{
                fontSize: "clamp(3rem, 6vw, 4.2rem)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "var(--texto)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {horaFormatada}
            </div>
            <div
              className="texto-suave"
              style={{
                marginTop: "10px",
                fontSize: "1rem",
                textTransform: "capitalize",
              }}
            >
              {dataFormatada}
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--perigo)",
              fontSize: "0.82rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Caixa Fechado
          </div>

          {/* Se clicou em Abrir Caixa, exibe o input de fundo de troco */}
          {solicitandoAbertura ? (
            <form
              onSubmit={handleConfirmarAberturaCaixa}
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                marginTop: "10px",
                textAlign: "left",
              }}
            >
              <label>
                Valor disponível em caixa (fundo de troco)
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      fontWeight: 600,
                      color: "var(--texto-suave)",
                    }}
                  >
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    placeholder="0,00"
                    value={inputFundoTroco}
                    onChange={(e) => setInputFundoTroco(e.target.value)}
                    style={{ paddingLeft: "40px", fontSize: "1.1rem", fontWeight: 600 }}
                  />
                </div>
              </label>

              <div className="linha" style={{ gap: "10px", marginTop: "6px" }}>
                <button
                  type="button"
                  className="btn btn-secundario"
                  style={{ flex: 1 }}
                  onClick={() => setSolicitandoAbertura(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primario"
                  style={{ flex: 1 }}
                >
                  Confirmar
                </button>
              </div>
            </form>
          ) : (
            <div style={{ width: "100%", marginTop: "10px" }}>
              <button
                type="button"
                className="btn btn-primario grande"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleIniciarAbertura}
              >
                <Unlock size={18} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                Abrir Caixa
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDERIZAÇÃO: SE O CAIXA ESTIVER ABERTO (PDV Completo)
  // =========================================================
  return (
    <div className="pagina">
      {/* Toast Notifier Flutuante */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
            color: "#fff",
            background:
              toast.tipo === "erro"
                ? "var(--perigo)"
                : toast.tipo === "sucesso"
                ? "var(--sucesso)"
                : "var(--primaria)",
            fontWeight: 500,
            fontSize: "0.92rem",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          {toast.tipo === "erro" && <AlertCircle size={18} />}
          {toast.tipo === "sucesso" && <CheckCircle2 size={18} />}
          {toast.tipo === "info" && <Clock size={18} />}
          <span>{toast.mensagem}</span>
        </div>
      )}

      {/* CABEÇALHO DO PDV COM INFORMAÇÕES E BOTÃO "MAIS AÇÕES" */}
      <div
        className="card"
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
          position: "relative",
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.35rem", margin: 0, letterSpacing: "-0.03em" }}>
              Frente de Caixa (PDV)
            </h1>
            <span className="texto-suave" style={{ fontSize: "0.82rem" }}>
              MS² Vestuário • {usuario ? `${usuario.nome} (${usuario.perfil})` : "Operador"}
            </span>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(34, 197, 94, 0.12)",
              color: "#15803d",
              fontSize: "0.82rem",
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
              }}
            />
            Caixa Aberto
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.86rem",
              color: "var(--texto-suave)",
            }}
          >
            <span>Fundo inicial:</span>
            <strong style={{ color: "var(--texto)" }}>{formatarMoeda(fundoTroco)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.9rem",
              color: "var(--texto-suave)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Clock size={16} />
            <span>{horaFormatada}</span>
          </div>

          {/* Menu dropdown "Mais ações" */}
          <div style={{ position: "relative" }} ref={menuAcoesRef}>
            <button
              type="button"
              className="btn btn-secundario"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => setMenuAcoesAberto((v) => !v)}
              aria-expanded={menuAcoesAberto}
              aria-label="Mais ações"
            >
              <MoreVertical size={16} />
              <span>Mais ações</span>
            </button>

            {menuAcoesAberto && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  background: "var(--superficie)",
                  border: "1px solid var(--borda)",
                  borderRadius: "10px",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
                  padding: "6px",
                  zIndex: 100,
                  minWidth: "190px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <button
                  type="button"
                  className="btn btn-secundario"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    gap: "8px",
                    border: "none",
                    padding: "8px 12px",
                    textAlign: "left",
                    color: "var(--perigo)",
                  }}
                  onClick={() => {
                    setMenuAcoesAberto(false);
                    setModalFecharCaixa(true);
                  }}
                >
                  <Lock size={15} />
                  <span>Fechar Caixa</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secundario"
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    gap: "8px",
                    border: "none",
                    padding: "8px 12px",
                    textAlign: "left",
                  }}
                  onClick={() => {
                    setMenuAcoesAberto(false);
                    limparVenda();
                    exibirToast("Carrinho limpo.", "info");
                  }}
                  disabled={carrinho.length === 0}
                >
                  <RefreshCw size={15} />
                  <span>Limpar Carrinho (ESC)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL DO PDV */}
      <div className="pdv-grid">
        {/* COLUNA ESQUERDA: BUSCA DE PRODUTOS (LEITOR) + ITENS BIPADOS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* ÁREA DE BUSCA LIMPA PARA O LEITOR DE CÓDIGO DE BARRAS */}
          <section className="card" style={{ position: "relative", zIndex: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Barcode size={20} style={{ color: "var(--primaria)" }} />
                <span>Leitor de Código de Barras / SKU</span>
              </h2>
              <span className="texto-suave" style={{ fontSize: "0.8rem" }}>
                Pressione <strong>Enter</strong> para adicionar
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                processarLeituraProduto();
              }}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-end",
                position: "relative",
              }}
            >
              {/* CONTAINER COM O INPUT E O DROPDOWN SUSPENSO */}
              <div style={{ position: "relative", flex: 1 }} ref={buscaContainerRef}>
                <label style={{ margin: 0 }}>
                  Código de barras ou SKU
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Search
                      size={18}
                      style={{
                        position: "absolute",
                        left: "12px",
                        color: "var(--texto-suave)",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      ref={inputBuscaRef}
                      type="text"
                      value={termoBusca}
                      onChange={(e) => {
                        setTermoBusca(e.target.value);
                        setDropdownAberto(true);
                        setItemSelecionadoIndex(0);
                      }}
                      onFocus={() => {
                        if (termoBusca.trim()) {
                          setDropdownAberto(true);
                        }
                      }}
                      onKeyDown={handleKeyDownBusca}
                      placeholder="Pesquise por descrição ou código (SKU)"
                      autoFocus
                      disabled={salvando || carregandoDados}
                      style={{
                        paddingLeft: "38px",
                        fontSize: "1.05rem",
                        fontWeight: 500,
                      }}
                    />
                  </div>
                </label>

                {/* DROPDOWN DE SUGESTÕES PREDITIVAS */}
                {dropdownAberto && termoBusca.trim().length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 6px)",
                      left: 0,
                      right: 0,
                      background: "var(--superficie)",
                      border: "1px solid var(--borda)",
                      borderRadius: "10px",
                      boxShadow: "0 16px 36px rgba(15, 23, 42, 0.16)",
                      zIndex: 1000,
                      overflow: "hidden",
                    }}
                  >
                    {produtosSugeridos.length > 0 ? (
                      <>
                        <div
                          style={{
                            padding: "8px 12px",
                            background: "rgba(148, 163, 184, 0.08)",
                            borderBottom: "1px solid var(--borda)",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: "var(--texto-suave)",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>Produtos encontrados ({produtosSugeridos.length})</span>
                          <span>Navegue com ↑ ↓ • Enter para escolher</span>
                        </div>

                        <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                          {produtosSugeridos.map((prod, index) => {
                            const selecionado = index === itemSelecionadoIndex;
                            const semEstoque = prod.estoque < 1;

                            return (
                              <div
                                key={prod.id}
                                onClick={() => {
                                  if (!semEstoque) {
                                    adicionarProdutoAoCarrinho(prod, quantidadeBusca);
                                  }
                                }}
                                onMouseEnter={() => setItemSelecionadoIndex(index)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 14px",
                                  cursor: semEstoque ? "not-allowed" : "pointer",
                                  opacity: semEstoque ? 0.6 : 1,
                                  background: selecionado
                                    ? "rgba(29, 78, 216, 0.09)"
                                    : "transparent",
                                  borderLeft: selecionado
                                    ? "4px solid var(--primaria)"
                                    : "4px solid transparent",
                                  borderBottom: "1px solid var(--borda)",
                                  transition: "all 0.12s ease",
                                }}
                              >
                                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <strong style={{ color: "var(--texto)", fontSize: "0.95rem" }}>
                                      {prod.descricao}
                                    </strong>
                                    {semEstoque && (
                                      <span
                                        style={{
                                          fontSize: "0.7rem",
                                          color: "var(--perigo)",
                                          fontWeight: 700,
                                          padding: "2px 6px",
                                          borderRadius: "4px",
                                          background: "rgba(239, 68, 68, 0.12)",
                                        }}
                                      >
                                        Sem estoque
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.8rem", color: "var(--texto-suave)" }}>
                                    <span
                                      style={{
                                        fontFamily: "monospace",
                                        background: "rgba(148, 163, 184, 0.12)",
                                        padding: "1px 6px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      SKU: {prod.codigo}
                                    </span>
                                    <span>Estoque: {prod.estoque} un.</span>
                                  </div>
                                </div>

                                <div style={{ textAlign: "right" }}>
                                  <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--texto)" }}>
                                    {formatarMoeda(prod.preco)}
                                  </div>
                                  {!semEstoque && (
                                    <span style={{ fontSize: "0.75rem", color: "var(--primaria)", fontWeight: 600 }}>
                                      + Adicionar
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          padding: "16px",
                          textAlign: "center",
                          color: "var(--texto-suave)",
                          fontSize: "0.9rem",
                        }}
                      >
                        Nenhum produto correspondente a "<strong>{termoBusca}</strong>".
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CAMPO DE QUANTIDADE */}
              <label style={{ margin: 0, width: "105px" }}>
                Quantidade
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantidadeBusca}
                  onChange={(e) => setQuantidadeBusca(Math.max(1, Number(e.target.value) || 1))}
                  disabled={salvando || carregandoDados}
                  style={{ textAlign: "center", fontSize: "1.05rem", fontWeight: 600 }}
                />
              </label>

              {/* BOTÃO ADICIONAR / BIPAR */}
              <button
                type="submit"
                className="btn btn-primario"
                disabled={salvando || carregandoDados || !termoBusca.trim()}
                style={{
                  height: "42px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 18px",
                  gap: "6px",
                }}
              >
                <Plus size={16} />
                <span>Bipar</span>
              </button>
            </form>
          </section>

          {/* LISTA DE ITENS BIPADOS NA VENDA */}
          <section className="card" style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <ShoppingCart size={18} />
                <span>Itens da Venda ({carrinho.length})</span>
              </h2>

              {carrinho.length > 0 && (
                <span className="texto-suave" style={{ fontSize: "0.85rem" }}>
                  Subtotal: <strong>{formatarMoeda(subtotal)}</strong>
                </span>
              )}
            </div>

            {carrinho.length === 0 ? (
              <div
                className="empty-state"
                style={{
                  minHeight: "180px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <Barcode size={36} style={{ opacity: 0.3 }} />
                <div>
                  <strong style={{ display: "block", color: "var(--texto)", marginBottom: "4px" }}>
                    Nenhum produto adicionado
                  </strong>
                  <span className="texto-suave" style={{ fontSize: "0.88rem" }}>
                    Utilize o leitor de código de barras ou digite o código/SKU no campo acima e pressione <strong>Enter</strong>.
                  </span>
                </div>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Preço Un.</th>
                    <th style={{ textAlign: "center" }}>Qtd</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {carrinho.map((item) => {
                    const subtotalItem = (Math.round(item.produto.preco * 100) * item.quantidade) / 100;
                    return (
                      <tr key={item.produto.id}>
                        <td>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                              background: "rgba(148, 163, 184, 0.12)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.produto.codigo}
                          </span>
                        </td>
                        <td>
                          <strong>{item.produto.descricao}</strong>
                        </td>
                        <td>{formatarMoeda(item.produto.preco)}</td>
                        <td style={{ textAlign: "center" }}>
                          <div className="qtd" style={{ justifyContent: "center" }}>
                            <button
                              type="button"
                              className="btn btn-secundario"
                              onClick={() => alterarQuantidade(item.produto.id, -1)}
                              disabled={salvando}
                              aria-label="Diminuir quantidade"
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ fontWeight: 600, minWidth: "24px", textAlign: "center" }}>
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              className="btn btn-secundario"
                              onClick={() => alterarQuantidade(item.produto.id, 1)}
                              disabled={salvando || item.quantidade >= item.produto.estoque}
                              aria-label="Aumentar quantidade"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <strong>{formatarMoeda(subtotalItem)}</strong>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn btn-perigo"
                            style={{ padding: "5px 8px" }}
                            onClick={() => removerItem(item.produto.id)}
                            disabled={salvando}
                            title="Remover produto"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        </div>

        {/* COLUNA DIREITA: PAINEL LATERAL ("Venda atual") */}
        <section className="card" style={{ display: "flex", flexDirection: "column" }}>
          <h2>Venda atual</h2>

          <div className="campos-venda">
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--texto-suave)" }}>
                  Cliente (opcional)
                </span>
                <button
                  type="button"
                  className="btn btn-secundario"
                  style={{
                    padding: "2px 8px",
                    fontSize: "0.78rem",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    height: "26px",
                  }}
                  onClick={() => {
                    setErroCliente("");
                    setModalNovoClienteAberto(true);
                  }}
                  disabled={salvando}
                  title="Cadastrar novo cliente na hora da venda"
                >
                  <UserPlus size={13} style={{ color: "var(--primaria)" }} />
                  <span>+ Novo Cliente</span>
                </button>
              </div>

              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                disabled={salvando}
              >
                <option value="">Consumidor Final (Sem cadastro)</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} {c.cpf ? `(${mascararCpf(c.cpf)})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <label>
              Forma de pagamento
              <select
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value as FormaPagamento)}
                disabled={salvando}
              >
                <option value="DINHEIRO">Dinheiro</option>
                <option value="PIX">Pix</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
              </select>
            </label>

            <label>
              Desconto
              <div className="linha">
                <select
                  value={tipoDesconto}
                  disabled={salvando}
                  style={{ width: "85px" }}
                  onChange={(e) => setTipoDesconto(e.target.value as "percentual" | "valor")}
                >
                  <option value="percentual">%</option>
                  <option value="valor">R$</option>
                </select>
                <input
                  type="text"
                  inputMode="decimal"
                  value={descontoTexto}
                  disabled={salvando}
                  onChange={(e) => setDescontoTexto(e.target.value)}
                  placeholder="0"
                />
              </div>
            </label>

            {/* Input para cálculo de troco se a forma de pagamento for Dinheiro */}
            {pagamento === "DINHEIRO" && (
              <label>
                Valor recebido (R$)
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorRecebidoTexto}
                  disabled={salvando}
                  onChange={(e) => setValorRecebidoTexto(e.target.value)}
                  placeholder="Informe o valor em dinheiro"
                />
              </label>
            )}
          </div>

          {exigeAutorizacao && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.12)",
                color: "var(--perigo)",
                fontSize: "0.84rem",
                marginTop: "4px",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                Desconto acima de {LIMITE_DESCONTO_CAIXA}%: será solicitada a autorização de um gerente ao finalizar.
              </span>
            </div>
          )}

          {mensagemErro && <p className="erro">{mensagemErro}</p>}
          {mensagemSucesso && (
            <p style={{ color: "var(--sucesso)", fontWeight: 500, margin: "12px 0 0" }}>
              {mensagemSucesso}
            </p>
          )}

          {/* BOX DE TOTAIS */}
          <div className="totais" style={{ marginTop: "auto", paddingTop: "16px" }}>
            <div>
              <span className="texto-suave">Subtotal</span>
              <span>{formatarMoeda(subtotal)}</span>
            </div>
            <div>
              <span className="texto-suave">Desconto</span>
              <span style={{ color: valorDesconto > 0 ? "var(--perigo)" : "inherit" }}>
                − {formatarMoeda(valorDesconto)}
              </span>
            </div>

            {pagamento === "DINHEIRO" && valorRecebido > 0 && (
              <>
                <div>
                  <span className="texto-suave">Valor Recebido</span>
                  <span>{formatarMoeda(valorRecebido)}</span>
                </div>
                <div>
                  <span className="texto-suave">Troco do Cliente</span>
                  <strong style={{ color: "var(--sucesso)" }}>
                    {formatarMoeda(troco)}
                  </strong>
                </div>
              </>
            )}

            <div className="total">
              <span>Total</span>
              <span>{formatarMoeda(total)}</span>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="linha" style={{ marginTop: "16px", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={limparVenda}
              disabled={salvando || carrinho.length === 0}
              title="Cancelar Venda Atual (ESC)"
            >
              Cancelar Venda (ESC)
            </button>
            <button
              type="button"
              className="btn btn-primario grande"
              onClick={finalizar}
              disabled={salvando || carrinho.length === 0}
            >
              {salvando ? "Finalizando..." : "Finalizar Venda (F2)"}
            </button>
          </div>
        </section>
      </div>

      {/* MODAL DE AUTORIZAÇÃO DE GERENTE (SE DESCONTO > 10%) */}
      {modalGerenteAberto && (
        <ModalAutorizacaoGerente
          onFechar={() => setModalGerenteAberto(false)}
          onAutorizar={onAutorizarGerente}
        />
      )}

      {/* MODAL DE FECHAMENTO E CONFERÊNCIA DE CAIXA */}
      {modalFecharCaixa && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={19} style={{ color: "var(--perigo)" }} />
                <span>Fechamento e Conferência de Caixa</span>
              </h3>
              <button
                type="button"
                className="btn btn-secundario"
                style={{ padding: "4px 8px" }}
                onClick={() => {
                  setModalFecharCaixa(false);
                  setValorConferenciaTexto("");
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* RESUMO DOS VALORES DO TURNO */}
            <div
              style={{
                background: "var(--fundo)",
                border: "1px solid var(--borda)",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="texto-suave">Fundo inicial (Abertura):</span>
                <strong>{formatarMoeda(fundoTroco)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="texto-suave">Vendas no turno ({qtdVendasTurno}):</span>
                <strong style={{ color: "var(--sucesso)" }}>+ {formatarMoeda(vendasDinheiroTurno)} (em dinheiro)</strong>
              </div>
              {vendasTotalTurno > vendasDinheiroTurno && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                  <span className="texto-suave">Vendas em Pix / Cartão:</span>
                  <span>{formatarMoeda(vendasTotalTurno - vendasDinheiroTurno)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: "8px",
                  marginTop: "4px",
                  borderTop: "1px dashed var(--borda)",
                  fontSize: "1rem",
                }}
              >
                <span>
                  <strong>Saldo esperado em gaveta:</strong>
                </span>
                <strong style={{ color: "var(--primaria)", fontSize: "1.08rem" }}>
                  {formatarMoeda(saldoEsperado)}
                </strong>
              </div>
            </div>

            {/* CAMPO PARA INFORMAR O VALOR CONTADO */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label>
                Valor contado em dinheiro atualmente (R$) *
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      fontWeight: 700,
                      color: "var(--texto-suave)",
                    }}
                  >
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    placeholder="0,00"
                    value={valorConferenciaTexto}
                    onChange={(e) => setValorConferenciaTexto(e.target.value)}
                    style={{
                      paddingLeft: "42px",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                    }}
                  />
                </div>
              </label>
              <span className="texto-suave" style={{ fontSize: "0.78rem" }}>
                Regra de tolerância: limite permitido de até R$ 2,00 para mais ou para menos.
              </span>
            </div>

            {/* STATUS DA CONFERÊNCIA EM TEMPO REAL */}
            {temValorInformado && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.88rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  background: conferidoAprovado
                    ? "rgba(34, 197, 94, 0.12)"
                    : "rgba(239, 68, 68, 0.12)",
                  border: `1px solid ${
                    conferidoAprovado ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"
                  }`,
                  color: conferidoAprovado ? "#15803d" : "var(--perigo)",
                }}
              >
                {conferidoAprovado ? (
                  <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                ) : (
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                )}
                <div>
                  <strong style={{ display: "block", marginBottom: "2px" }}>
                    {diferencaAbs < 0.01
                      ? "Caixa exato (Sem divergência)"
                      : diferencaConferencia > 0
                      ? `Sobra de ${formatarMoeda(diferencaConferencia)}`
                      : `Falta de ${formatarMoeda(diferencaAbs)}`}
                  </strong>
                  <span>
                    {conferidoAprovado
                      ? diferencaAbs < 0.01
                        ? "O valor contado bate perfeitamente com o saldo esperado."
                        : `Divergência de ${formatarMoeda(diferencaAbs)} está dentro da margem permitida de até R$ 2,00.`
                      : `Divergência de ${formatarMoeda(diferencaAbs)} ultrapassa o limite permitido de R$ 2,00. Reconte os valores na gaveta.`}
                  </span>
                </div>
              </div>
            )}

            {carrinho.length > 0 && (
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--perigo)" }}>
                Atenção: Os itens da venda atual não finalizada serão cancelados ao fechar o caixa.
              </p>
            )}

            {/* BOTÕES DE AÇÃO */}
            <div className="linha" style={{ justifyContent: "flex-end", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => {
                  setModalFecharCaixa(false);
                  setValorConferenciaTexto("");
                }}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-primario"
                style={{ background: conferidoAprovado ? "var(--perigo)" : undefined }}
                onClick={handleFecharCaixa}
                disabled={!conferidoAprovado}
                title={
                  !temValorInformado
                    ? "Informe o valor contado em caixa"
                    : !conferidoAprovado
                    ? "A divergência excede o limite de R$ 2,00"
                    : "Confirmar fechamento de caixa"
                }
              >
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO RÁPIDO DE CLIENTE NO BALCÃO */}
      {modalNovoClienteAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "480px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={19} style={{ color: "var(--primaria)" }} />
                <span>Novo Cliente no Balcão</span>
              </h3>
              <button
                type="button"
                className="btn btn-secundario"
                style={{ padding: "4px 8px" }}
                onClick={() => setModalNovoClienteAberto(false)}
                disabled={salvandoCliente}
              >
                <X size={16} />
              </button>
            </div>

            <p className="texto-suave" style={{ margin: 0, fontSize: "0.88rem" }}>
              Preencha os dados do cliente para associá-lo automaticamente a esta venda.
            </p>

            <form onSubmit={handleSalvarNovoCliente} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label>
                Nome completo *
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Nome do cliente"
                  value={novoClienteForm.nome}
                  onChange={(e) =>
                    setNovoClienteForm((prev) => ({ ...prev, nome: e.target.value }))
                  }
                  disabled={salvandoCliente}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label>
                  CPF *
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={novoClienteForm.cpf}
                    onChange={(e) =>
                      setNovoClienteForm((prev) => ({
                        ...prev,
                        cpf: mascararCpf(e.target.value),
                      }))
                    }
                    disabled={salvandoCliente}
                  />
                </label>

                <label>
                  Telefone (opcional)
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={novoClienteForm.telefone}
                    onChange={(e) =>
                      setNovoClienteForm((prev) => ({
                        ...prev,
                        telefone: mascararTelefone(e.target.value),
                      }))
                    }
                    disabled={salvandoCliente}
                  />
                </label>
              </div>

              <label>
                E-mail (opcional)
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={novoClienteForm.email}
                  onChange={(e) =>
                    setNovoClienteForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={salvandoCliente}
                />
              </label>

              {erroCliente && <p className="erro" style={{ margin: "4px 0 0" }}>{erroCliente}</p>}

              <div className="linha" style={{ justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secundario"
                  onClick={() => setModalNovoClienteAberto(false)}
                  disabled={salvandoCliente}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primario"
                  disabled={salvandoCliente}
                >
                  {salvandoCliente ? "Cadastrando..." : "Cadastrar e Vincular"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
