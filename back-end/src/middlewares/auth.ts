export * from './auth.middleware'; // Reexporta os middlewares para facilitar importação em outras partes do código
export { autenticarToken as autenticar } from './auth.middleware'; // Alias para manter compatibilidade com nomes mais curtos na aplicação
