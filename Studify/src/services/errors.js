/**
 * Factory de erros estruturados dos serviços.
 *
 * Cada erro carrega um `code` estável (ex.: 'EMAIL_EXISTS', 'DB_UNAVAILABLE')
 * para que as telas possam mapear mensagens amigáveis sem depender de
 * strings de mensagem ou de mensagens internas do SQLite.
 *
 * O erro original (se houver) é preservado em `cause` para debug.
 */
export function createServiceError(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause !== undefined) {
    error.cause = cause;
  }
  return error;
}

export function isServiceError(error, code) {
  return !!error && error.code === code;
}