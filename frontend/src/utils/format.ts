export function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function validarCpf(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, "");

  // Exige exatamente 11 dígitos e rejeita sequências repetidas
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) {
    return false;
  }

  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i += 1) {
    soma += Number(digitos[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  const digito1 = resto === 10 || resto === 11 ? 0 : resto;

  if (Number(digitos[9]) !== digito1) {
    return false;
  }

  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i += 1) {
    soma += Number(digitos[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  const digito2 = resto === 10 || resto === 11 ? 0 : resto;

  return Number(digitos[10]) === digito2;
}

export function mascararCpf(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function mascararTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}