import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseGoogleDocument } from './google-doc-parser';

const fixtureUrl = new URL('./fixtures/google-doc-demo.json', import.meta.url);
const destinationUrl = new URL('../src/content/home.json', import.meta.url);
const document = JSON.parse(await readFile(fixtureUrl, 'utf8'));
const page = parseGoogleDocument(document);

await writeFile(destinationUrl, `${JSON.stringify(page, null, 2)}\n`);
console.log(`Conteúdo de demonstração sincronizado em ${fileURLToPath(destinationUrl)}.`);
