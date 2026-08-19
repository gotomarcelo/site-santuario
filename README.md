# Drive CMS POC

Prova de conceito de um site Astro que converte tabelas de um Google Doc em blocks e gera HTML estático.

## Executar a demonstração local

```bash
npm install
npm run sync:demo
npm run dev
```

Abra `http://localhost:4321` ou `http://localhost:4321/quem-somos/`. Ao editar as fixtures e rodar `npm run sync:demo`, o conteúdo em `src/content/pages/` é regenerado. O build de produção é validado com:

```bash
npm run build
```

## Contrato editorial para o Google Docs

Cada tabela representa um block. A primeira linha contém apenas seu identificador; as demais linhas são os dados.

### Hero

| hero | | | | |
| --- | --- | --- | --- | --- |
| título | descrição | URL da imagem | texto do CTA | URL do CTA |

### Cards

| cards | | |
| --- | --- | --- |
| título da seção | | |
| título do card | descrição | URL |

### FAQ

| faq | |
| --- | --- |
| título da seção | |
| pergunta | resposta |

No Google Docs, crie a tabela com o número máximo de colunas necessário e mescle as células vazias da primeira linha, se quiser uma apresentação mais limpa. O parser ignora células vazias na primeira linha.

## Conectar a um Google Doc real

1. Crie um projeto no Google Cloud Console.
2. Habilite **Google Docs API**.
3. Em **Google Auth platform → Clients**, crie um cliente OAuth do tipo **Desktop app** e baixe o JSON.
4. Salve o download como `credentials.json` na raiz do projeto. Esse arquivo é ignorado pelo Git.
5. Crie um arquivo `.env` na raiz do projeto (ele não vai para o Git). Para um site de uma página, use:

```env
GOOGLE_DOCUMENT_ID="id-do-documento"
```

Para um site multipágina, crie uma pasta raiz no Google Drive. O documento diretamente dentro dela representa `/`; cada subpasta representa um segmento da URL e deve conter seu próprio documento:

```env
GOOGLE_DRIVE_FOLDER_ID="id-da-pasta-raiz"
```

Por exemplo, uma pasta `site` com um documento e as subpastas `quem-somos`, `noticias` e `agenda` gera `/`, `/quem-somos/`, `/noticias/` e `/agenda/`. Subpastas podem ser aninhadas. Os nomes são convertidos para slug e duas pastas irmãs não podem gerar o mesmo slug.

6. No terminal, execute:

```bash
npm run sync:google
```

Na primeira execução, o navegador abre para você consentir com a leitura dos seus Google Docs e do Drive. O comando converte cada documento em JSON dentro de `src/content/pages/` e, em seguida, `npm run dev` ou `npm run build` gera uma rota estática para cada página.

> Para produção, use OAuth por cliente, criptografe os tokens e nunca exponha credenciais no navegador ou no Git.

## Próximas evoluções

- Adicionar metadata, imagens do Drive e páginas de post.
- Criar preview e publicação via Cloudflare Pages.
- Registrar a configuração OAuth de cada cliente.
