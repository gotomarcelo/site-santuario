import { access } from "node:fs/promises";
import { authenticate } from "@google-cloud/local-auth";
import "dotenv/config";
import { google } from "googleapis";
import { parseGoogleDocument } from "./google-doc-parser";
import { materializePageImages, prepareImageDirectory } from "./image-assets";
import { writeFragments, writePages } from "./content-writer";

const documentId = process.env.GOOGLE_DOCUMENT_ID;
const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
const credentialsPath = new URL("../credentials.json", import.meta.url);

if (!documentId && !rootFolderId) {
  throw new Error(
    "Defina GOOGLE_DRIVE_FOLDER_ID (site multipágina) ou GOOGLE_DOCUMENT_ID no arquivo .env.",
  );
}

try {
  await access(credentialsPath);
} catch {
  throw new Error(
    "Arquivo credentials.json não encontrado. Baixe o JSON do OAuth Client (tipo Desktop app) no Google Cloud e salve-o na raiz do projeto.",
  );
}

const auth = await authenticate({
  scopes: [
    "https://www.googleapis.com/auth/documents.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
  keyfilePath: credentialsPath.pathname,
});
const docs = google.docs({ version: "v1", auth });

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function pageFromDocument(id: string) {
  const response = await docs.documents.get({ documentId: id });
  return materializePageImages(parseGoogleDocument(response.data));
}

async function childrenOf(folderId: string) {
  const response = await google.drive({ version: "v3", auth }).files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: "files(id,name,mimeType)",
    orderBy: "folder,name",
    pageSize: 1000,
  });
  return response.data.files ?? [];
}

async function pagesInFolder(folderId: string, path: string[] = []) {
  const children = await childrenOf(folderId);
  const documents = children.filter(
    (file) => file.mimeType === "application/vnd.google-apps.document",
  );
  const folders = children.filter(
    (file) =>
      file.mimeType === "application/vnd.google-apps.folder" &&
      !(path.length === 0 && slugify(file.name ?? "") === "fragmentos"),
  );

  if (documents.length > 1) {
    throw new Error(
      `A pasta ${path.join("/") || "(raiz)"} precisa ter no máximo um Google Doc.`,
    );
  }

  const pages = documents.length
    ? [{ path, page: await pageFromDocument(documents[0].id!) }]
    : [];
  const slugs = new Set<string>();

  for (const folder of folders) {
    const slug = slugify(folder.name ?? "");
    if (!slug)
      throw new Error(
        `A pasta ${folder.name || "(sem nome)"} não pode virar uma URL válida.`,
      );
    if (slugs.has(slug)) {
      throw new Error(
        `Duas pastas na mesma hierarquia geram o mesmo slug: ${slug}.`,
      );
    }
    slugs.add(slug);
    pages.push(...(await pagesInFolder(folder.id!, [...path, slug])));
  }

  return pages;
}

async function fragmentsInFolder(folderId: string, path: string[] = []) {
  const children = await childrenOf(folderId);
  const documents = children.filter(
    (file) => file.mimeType === "application/vnd.google-apps.document",
  );
  const folders = children.filter(
    (file) => file.mimeType === "application/vnd.google-apps.folder",
  );
  if (documents.length > 1)
    throw new Error(
      `O fragmento ${path.join("/")} possui mais de um documento.`,
    );

  const documentSlug = slugify(documents[0]?.name ?? "");
  const fragmentPath = path.length ? path : [documentSlug];
  const fragments = documents.length
    ? [{ path: fragmentPath, page: await pageFromDocument(documents[0].id!) }]
    : [];
  if (documents.length && !slugify(documents[0].name ?? "")) {
    throw new Error(
      `O documento de fragmento dentro de ${path.join("/") || "fragmentos"} precisa ter um nome válido.`,
    );
  }
  for (const folder of folders) {
    const slug = slugify(folder.name ?? "");
    if (!slug)
      throw new Error(
        `O fragmento ${folder.name || "(sem nome)"} não pode virar uma referência válida.`,
      );
    fragments.push(...(await fragmentsInFolder(folder.id!, [...path, slug])));
  }
  return fragments;
}

let pages;
let fragments: Array<{
  path: string[];
  page: Awaited<ReturnType<typeof pageFromDocument>>;
}> = [];
await prepareImageDirectory();
if (rootFolderId) {
  const rootChildren = await childrenOf(rootFolderId);
  const fragmentFolder = rootChildren.find(
    (file) =>
      file.mimeType === "application/vnd.google-apps.folder" &&
      slugify(file.name ?? "") === "fragmentos",
  );
  pages = await pagesInFolder(rootFolderId);
  if (fragmentFolder?.id)
    fragments = await fragmentsInFolder(fragmentFolder.id);
} else {
  pages = [{ path: [], page: await pageFromDocument(documentId!) }];
}

await writePages(pages);
await writeFragments(fragments);
console.log(`${pages.length} página(s) sincronizada(s) em src/content/pages/.`);
console.log(
  `${fragments.length} fragmento(s) sincronizado(s) em src/content/fragments/.`,
);
