export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginValidationResult = {
  isValid: boolean;
  message?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginPayload(payload: LoginPayload): LoginValidationResult {
  const email = payload.email.trim();
  const password = payload.password;

  if (!email) {
    return { isValid: false, message: "Email is required." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, message: "Please enter a valid email address." };
  }

  if (!password) {
    return { isValid: false, message: "Password is required." };
  }

  return { isValid: true };
}
