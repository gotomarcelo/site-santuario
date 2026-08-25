import type { Block, Page } from "../src/lib/types";

export type GoogleDocument = {
  title?: string | null;
  body?: { content?: StructuralElement[] | null } | null;
};

export type StructuralElement = {
  paragraph?: {
    elements?: Array<{ textRun?: { content?: string | null } | null }> | null;
  } | null;
  table?: {
    tableRows?: Array<{
      tableCells?: Array<{ content?: StructuralElement[] | null }> | null;
    }> | null;
  } | null;
};

const clean = (value = "") =>
  value.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

function textFromContent(
  content: StructuralElement[] | null | undefined,
): string {
  return (content ?? [])
    .map((element) => {
      if (!element.paragraph) return "";
      return (element.paragraph.elements ?? [])
        .map((part) => part.textRun?.content ?? "")
        .join("");
    })
    .join(" ");
}

function rowsFromTable(element: StructuralElement): string[][] {
  return (element.table?.tableRows ?? []).map((row) =>
    (row.tableCells ?? []).map((cell) => clean(textFromContent(cell.content))),
  );
}

function firstValue(row: string[] | undefined): string {
  return row?.find(Boolean) ?? "";
}

function blockFromRows(rows: string[][]): Block | null {
  const blockName = firstValue(rows[0]).toLowerCase();
  const body = rows.slice(1).filter((row) => row.some(Boolean));

  if (blockName === "header") {
    const [eyebrow = "", brand = "", ctaLabel = "", ctaHref = "#"] =
      body[0] ?? [];
    const links = body
      .slice(1)
      .map(([label = "", href = "#"]) => ({ label, href }))
      .filter((link) => link.label);
    if (!brand)
      throw new Error("O block header precisa informar o nome da marca.");
    return {
      type: "header",
      eyebrow,
      brand,
      cta: { label: ctaLabel, href: ctaHref },
      links,
    };
  }

  if (blockName === "fragment" || blockName === "experience-fragment") {
    const name = firstValue(body[0]);
    if (!name)
      throw new Error(
        "A referência de fragmento precisa informar o nome do fragmento.",
      );
    return { type: "fragment", name };
  }

  if (blockName)
    console.warn(
      `Block "${blockName}" ignorado: ele não está cadastrado no parser.`,
    );
  return null;
}

export function parseGoogleDocument(document: GoogleDocument): Page {
  const content = document.body?.content ?? [];
  const tables = content.filter((element) => element.table);
  const blocks = tables
    .map(rowsFromTable)
    .map(blockFromRows)
    .filter((block): block is Block => block !== null);

  if (!blocks.length) {
    const paragraphs = content.filter((element) => element.paragraph).length;
    throw new Error(
      `Nenhum block válido foi encontrado. A API recebeu ${tables.length} tabela(s) e ${paragraphs} parágrafo(s). ` +
        "Cada block precisa ser uma tabela do Google Docs cuja primeira linha tenha o nome do block: header ou fragment.",
    );
  }

  return {
    title: document.title || "Site sem título",
    description: "Página gerada automaticamente a partir de um Google Doc.",
    blocks,
  };
}
