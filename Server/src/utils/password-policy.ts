export const MIN_PASSWORD_LENGTH = 10;

export const PASSWORD_POLICY_HINT =
  "La contraseña debe tener al menos 10 caracteres e incluir letras, numeros y un caracter especial.";

export function getPasswordPolicyError(password: string): string | null {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return PASSWORD_POLICY_HINT;
  }

  if (!/[A-Za-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra.";
  }

  if (!/\d/.test(password)) {
    return "La contraseña debe incluir al menos un numero.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un caracter especial.";
  }

  return null;
}
