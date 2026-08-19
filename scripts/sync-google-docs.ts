import { access, writeFile } from 'node:fs/promises';
import { authenticate } from '@google-cloud/local-auth';
import 'dotenv/config';
import { google } from 'googleapis';
import { parseGoogleDocument } from './google-doc-parser';

const documentId = process.env.GOOGLE_DOCUMENT_ID;
const credentialsPath = new URL('../credentials.json', import.meta.url);

if (!documentId) {
  throw new Error('Defina GOOGLE_DOCUMENT_ID no arquivo .env. Veja .env.example.');
}

try {
  await access(credentialsPath);
} catch {
  throw new Error('Arquivo credentials.json não encontrado. Baixe o JSON do OAuth Client (tipo Desktop app) no Google Cloud e salve-o na raiz do projeto.');
}

const auth = await authenticate({
  scopes: ['https://www.googleapis.com/auth/documents.readonly'],
  keyfilePath: credentialsPath.pathname,
});
const docs = google.docs({ version: 'v1', auth });
const response = await docs.documents.get({ documentId });
const page = parseGoogleDocument(response.data);
const destinationUrl = new URL('../src/content/home.json', import.meta.url);

await writeFile(destinationUrl, `${JSON.stringify(page, null, 2)}\n`);
console.log(`Documento ${documentId} convertido para ${destinationUrl.pathname}.`);
