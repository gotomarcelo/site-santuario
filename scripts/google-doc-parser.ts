import type { Block, Page } from '../src/lib/types';

type GoogleDocument = {
  title?: string | null;
  body?: { content?: StructuralElement[] | null } | null;
};

type StructuralElement = {
  paragraph?: { elements?: Array<{ textRun?: { content?: string | null } | null }> | null } | null;
  table?: {
    tableRows?: Array<{
      tableCells?: Array<{ content?: StructuralElement[] | null }> | null;
    }> | null;
  } | null;
};

const clean = (value = '') => value.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

function textFromContent(content: StructuralElement[] | null | undefined): string {
  return (content ?? [])
    .map((element) => {
      if (!element.paragraph) return '';
      return (element.paragraph.elements ?? [])
        .map((part) => part.textRun?.content ?? '')
        .join('');
    })
    .join(' ');
}

function rowsFromTable(element: StructuralElement): string[][] {
  return (element.table?.tableRows ?? []).map((row) =>
    (row.tableCells ?? []).map((cell) => clean(textFromContent(cell.content))),
  );
}

function firstValue(row: string[] | undefined): string {
  return row?.find(Boolean) ?? '';
}

function blockFromRows(rows: string[][]): Block | null {
  const blockName = firstValue(rows[0]).toLowerCase();
  const body = rows.slice(1).filter((row) => row.some(Boolean));

  if (blockName === 'hero') {
    const [title = '', description = '', image = '', label = '', href = '#'] = body[0] ?? [];
    if (!title) throw new Error('O block hero precisa de uma linha com título, descrição, imagem, CTA e URL.');
    return { type: 'hero', title, description, image, cta: { label, href } };
  }

  if (blockName === 'cards') {
    const title = firstValue(body[0]);
    const items = body.slice(1).map(([itemTitle = '', description = '', href = '#']) => ({
      title: itemTitle,
      description,
      href,
    })).filter((item) => item.title);
    if (!title || !items.length) throw new Error('O block cards precisa de título e pelo menos um card.');
    return { type: 'cards', title, items };
  }

  if (blockName === 'faq') {
    const title = firstValue(body[0]);
    const items = body.slice(1).map(([question = '', answer = '']) => ({ question, answer }))
      .filter((item) => item.question && item.answer);
    if (!title || !items.length) throw new Error('O block faq precisa de título e pelo menos uma pergunta/resposta.');
    return { type: 'faq', title, items };
  }

  if (blockName) console.warn(`Block "${blockName}" ignorado: ele não está cadastrado no parser.`);
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
      'Cada block precisa ser uma tabela do Google Docs cuja primeira linha tenha o nome do block: hero, cards ou faq.',
    );
  }

  return {
    title: document.title || 'Site sem título',
    description: 'Página gerada automaticamente a partir de um Google Doc.',
    blocks,
  };
}
