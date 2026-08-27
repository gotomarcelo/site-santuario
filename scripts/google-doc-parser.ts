import type { Block, Page } from "../src/lib/types";

export type GoogleDocument = {
  title?: string | null;
  body?: { content?: StructuralElement[] | null } | null;
  inlineObjects?: Record<string, InlineObject> | null;
};

type InlineObject = {
  inlineObjectProperties?: {
    embeddedObject?: {
      imageProperties?: { contentUri?: string | null } | null;
    } | null;
  } | null;
};

export type StructuralElement = {
  paragraph?: {
    elements?: Array<{
      textRun?: { content?: string | null } | null;
      inlineObjectElement?: { inlineObjectId?: string | null } | null;
    }> | null;
  } | null;
  inlineObjectElement?: { inlineObjectId?: string | null } | null;
  table?: {
    tableRows?: Array<{
      tableCells?: Array<{ content?: StructuralElement[] | null }> | null;
    }> | null;
  } | null;
};

const clean = (value = "") =>
  value.replace(/\n/g, " ").replace(/\s+/g, " ").trim();

type ParsedCell = { text: string; image?: string };

function cellFromContent(
  content: StructuralElement[] | null | undefined,
  inlineObjects: GoogleDocument["inlineObjects"],
): ParsedCell {
  let text = "";
  let image: string | undefined;
  for (const element of content ?? []) {
    const parts = element.paragraph?.elements ?? [];
    text += parts.map((part) => part.textRun?.content ?? "").join("");
    const objectId = parts.find((part) => part.inlineObjectElement)
      ?.inlineObjectElement?.inlineObjectId;
    const contentUri = objectId
      ? inlineObjects?.[objectId]?.inlineObjectProperties?.embeddedObject
          ?.imageProperties?.contentUri
      : undefined;
    if (contentUri) image = contentUri;
  }
  return { text: clean(text), image };
}

function rowsFromTable(
  element: StructuralElement,
  document: GoogleDocument,
): ParsedCell[][] {
  return (element.table?.tableRows ?? []).map((row) =>
    (row.tableCells ?? []).map((cell) =>
      cellFromContent(cell.content, document.inlineObjects),
    ),
  );
}

function firstValue(row: ParsedCell[] | undefined): string {
  return row?.find((cell) => cell.text)?.text ?? "";
}

function blockFromRows(rows: ParsedCell[][]): Block | null {
  const blockName = firstValue(rows[0]).toLowerCase();
  const body = rows.slice(1).filter((row) => row.some(Boolean));

  if (blockName === "header") {
    const settings = body[0] ?? [];
    const hasLogoCell = Boolean(
      settings[0]?.image || /^https?:\/\//i.test(settings[0]?.text ?? ""),
    );
    const logo =
      settings[0]?.image ?? (hasLogoCell ? settings[0]?.text : undefined);
    const [eyebrow = "", brand = "", ctaLabel = "", ctaHref = "#"] = (
      hasLogoCell ? settings.slice(1) : settings
    ).map((cell) => cell.text);
    const links = body
      .slice(1)
      .map(([labelCell, hrefCell]) => ({
        label: labelCell?.text ?? "",
        href: hrefCell?.text ?? "#",
      }))
      .filter((link) => link.label);
    if (!brand)
      throw new Error("O block header precisa informar o nome da marca.");
    return {
      type: "header",
      logo,
      eyebrow,
      brand,
      cta: { label: ctaLabel, href: ctaHref },
      links,
    };
  }

  if (blockName === "hero") {
    const [
      eyebrowCell,
      titleCell,
      highlightCell,
      titleAfterCell,
      descriptionCell,
      imageCell,
      imageAltCell,
      captionCell,
    ] = body[0] ?? [];
    const eyebrow = eyebrowCell?.text ?? "";
    const title = titleCell?.text ?? "";
    const highlight = highlightCell?.text ?? "";
    const titleAfter = titleAfterCell?.text ?? "";
    const description = descriptionCell?.text ?? "";
    const image = imageCell?.image ?? imageCell?.text ?? "";
    if (!title || !description || !image) {
      throw new Error(
        "O block hero precisa informar título, descrição e imagem.",
      );
    }
    return {
      type: "hero",
      eyebrow,
      title,
      highlight,
      titleAfter,
      description,
      image,
      imageAlt: imageAltCell?.text ?? "",
      caption: captionCell?.text ?? "",
    };
  }

  if (blockName === "mass-schedule" || blockName === "missas") {
    const [titleCell, descriptionCell, noteCell] = body[0] ?? [];
    const entries = body
      .slice(1)
      .map(([groupCell, dayCell, timeCell]) => ({
        group: groupCell?.text ?? "",
        day: dayCell?.text ?? "",
        time: timeCell?.text ?? "",
      }))
      .filter((entry) => entry.group && entry.day && entry.time);
    const groups = entries.reduce<
      Array<{ name: string; entries: Array<{ day: string; time: string }> }>
    >((result, entry) => {
      const group = result.find((item) => item.name === entry.group);
      if (group) group.entries.push({ day: entry.day, time: entry.time });
      else
        result.push({
          name: entry.group,
          entries: [{ day: entry.day, time: entry.time }],
        });
      return result;
    }, []);
    if (!titleCell?.text || !entries.length) {
      throw new Error(
        "O block mass-schedule precisa informar título e pelo menos um horário.",
      );
    }
    return {
      type: "mass-schedule",
      title: titleCell.text,
      description: descriptionCell?.text ?? "",
      note: noteCell?.text ?? "",
      groups,
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
    .map((table) => rowsFromTable(table, document))
    .map(blockFromRows)
    .filter((block): block is Block => block !== null);

  if (!blocks.length) {
    const paragraphs = content.filter((element) => element.paragraph).length;
    throw new Error(
      `Nenhum block válido foi encontrado. A API recebeu ${tables.length} tabela(s) e ${paragraphs} parágrafo(s). ` +
        "Cada block precisa ser uma tabela do Google Docs cuja primeira linha tenha o nome do block: header, hero, mass-schedule ou fragment.",
    );
  }

  return {
    title: document.title || "Site sem título",
    description: "Página gerada automaticamente a partir de um Google Doc.",
    blocks,
  };
}
