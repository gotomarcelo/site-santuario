import { readFile } from 'node:fs/promises';
import { parseGoogleDocument } from './google-doc-parser';
import { writePages } from './content-writer';

const fixtureUrl = new URL('./fixtures/google-doc-demo.json', import.meta.url);
const aboutFixtureUrl = new URL('./fixtures/google-doc-quem-somos.json', import.meta.url);
const document = JSON.parse(await readFile(fixtureUrl, 'utf8'));
const aboutDocument = JSON.parse(await readFile(aboutFixtureUrl, 'utf8'));

await writePages([
	{ path: [], page: parseGoogleDocument(document) },
	{ path: ['quem-somos'], page: parseGoogleDocument(aboutDocument) },
]);
console.log('Conteúdo de demonstração sincronizado em src/content/pages/.');
