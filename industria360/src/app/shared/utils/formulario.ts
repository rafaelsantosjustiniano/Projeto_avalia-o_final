import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Verdadeiro quando o campo deve exibir erro (inválido e tocado ou após submit). */
export function campoInvalido(form: FormGroup, nome: string, enviado: boolean): boolean {
  const c = form.get(nome);
  return !!c && c.invalid && (c.touched || enviado);
}

/** Mensagem de erro padrão para um campo. */
export function mensagemErro(form: FormGroup, nome: string): string {
  const e = form.get(nome)?.errors;
  if (!e) return '';
  if (e['required']) return 'Campo obrigatório.';
  if (e['email']) return 'Informe um e-mail válido.';
  if (e['min']) return `Valor mínimo: ${e['min'].min}.`;
  if (e['minlength']) return `Mínimo de ${e['minlength'].requiredLength} caracteres.`;
  if (e['maxlength']) return `Máximo de ${e['maxlength'].requiredLength} caracteres.`;
  if (e['pattern']) return 'Formato inválido.';
  if (e['duplicado']) return 'Já existe um registro com este valor.';
  if (e['dataAnterior']) return 'A data deve ser posterior à data inicial.';
  return 'Valor inválido.';
}

/** Validador: campo de texto não pode conter apenas espaços. */
export const naoVazio: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  typeof c.value === 'string' && c.value.length > 0 && !c.value.trim() ? { required: true } : null;

/** Validador de unicidade (ex.: código do equipamento). */
export function unico(existentes: () => string[]): ValidatorFn {
  return (c: AbstractControl) => {
    const v = String(c.value ?? '').trim().toLowerCase();
    if (!v) return null;
    return existentes().some(e => e.trim().toLowerCase() === v) ? { duplicado: true } : null;
  };
}
