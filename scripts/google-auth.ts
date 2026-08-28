import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { authenticate } from "@google-cloud/local-auth";
import { google, type Auth } from "googleapis";
import type { JWTInput } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/drive.readonly",
];

const credentialsPath = new URL("../credentials.json", import.meta.url);

export type GoogleClientAuth = Auth.GoogleAuth | Auth.OAuth2Client;

export async function createGoogleAuth(): Promise<GoogleClientAuth> {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (json) {
    return new google.auth.GoogleAuth({
      credentials: parseServiceAccountJson(json),
      scopes: SCOPES,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new google.auth.GoogleAuth({ scopes: SCOPES });
  }

  try {
    await access(credentialsPath);
  } catch {
    throw new Error(
      "Nenhuma credencial encontrada. Defina GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_APPLICATION_CREDENTIALS, ou salve credentials.json na raiz do projeto.",
    );
  }

  const raw = JSON.parse(await readFile(credentialsPath, "utf8")) as {
    type?: string;
    installed?: unknown;
    web?: unknown;
  };

  if (raw.type === "service_account") {
    return new google.auth.GoogleAuth({
      keyFile: fileURLToPath(credentialsPath),
      scopes: SCOPES,
    });
  }

  if (raw.installed || raw.web) {
    return authenticate({
      scopes: SCOPES,
      keyfilePath: fileURLToPath(credentialsPath),
    });
  }

  throw new Error(
    "credentials.json precisa ser uma chave de conta de serviço ou um cliente OAuth (Desktop app).",
  );
}

export async function getAuthAccessToken(
  auth: GoogleClientAuth,
): Promise<string | null> {
  const token = await auth.getAccessToken();
  if (!token) return null;
  return typeof token === "string" ? token : (token.token ?? null);
}

function parseServiceAccountJson(value: string): JWTInput {
  let parsed: JWTInput;
  try {
    parsed = JSON.parse(value) as JWTInput;
  } catch {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON precisa ser o JSON completo da chave da conta de serviço.",
    );
  }
  if (parsed.type !== "service_account") {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON não é uma chave de conta de serviço.",
    );
  }
  return parsed;
}
