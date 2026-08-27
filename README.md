# Drive CMS POC

Prova de conceito de um site Astro que converte tabelas de um Google Doc em blocks e gera HTML estático.

## Executar a demonstração local

```bash
npm install
npm run sync:demo
npm run dev
```

Abra `http://localhost:4321`. Ao editar as fixtures e rodar `npm run sync:demo`, o conteúdo em `src/content/pages/` é regenerado. O build de produção é validado com:

```bash
npm run build
```

## Contrato editorial para o Google Docs

Cada tabela representa um block. A primeira linha contém apenas seu identificador; as demais linhas são os dados.

## Organização dos componentes

Cada componente Astro fica em uma pasta própria, com o markup e o estilo separados em Sass:

```text
src/components/blocks/
└── Header/
	├── Header.astro
	└── Header.scss
```

O arquivo `.astro` concentra props, HTML e comportamento do componente. O arquivo `.scss` concentra seus estilos e importa os tokens compartilhados:

```scss
@use '../../../styles/tokens' as *;
@use '../../../styles/mixins' as *;
```

Os tokens ficam em `src/styles/_tokens.scss` e incluem cores, tipografia, espaçamento, raios e breakpoints (`$breakpoint-mobile`, `$breakpoint-tablet` e `$breakpoint-header`). Os mixins compartilhados ficam em `src/styles/_mixins.scss`. Para criar um novo block, siga esse padrão e registre o componente em `BlockRenderer.astro` e `FragmentRenderer.astro`.

### Header

O header é um block que pode ser usado diretamente em uma página ou dentro de um fragmento `header`. A primeira linha de dados define o texto pequeno da marca, o nome da marca, o CTA e sua URL. As linhas seguintes definem os links do menu:

| header | | | | |
| --- | --- | --- | --- | --- |
| URL ou imagem do logo | Santuário | Nossa Senhora de Nazaré | Contribuir | #dizimo |
| Início | / |
| A Paróquia | /a-paroquia/ |
| Missas | /missas/ |

Na primeira célula da primeira linha de dados, cole a imagem do logo diretamente no Google Docs ou informe uma URL pública da imagem. As células seguintes são o texto pequeno da marca, o nome da marca, o CTA e a URL do CTA. Quando uma imagem é colada, o sincronizador lê o `inlineObject` da Google Docs API e usa sua imagem no header. Se a primeira célula ficar vazia, o header usa a cruz de fallback.

Durante `npm run sync:google`, imagens remotas do header são baixadas, convertidas para WebP com qualidade 85 e salvas em `public/images/`. O JSON passa a apontar para a URL local `/images/...webp`, evitando a expiração das URLs temporárias fornecidas pelo Google Docs. URLs de imagens inseridas nos próximos componentes podem usar a mesma etapa de materialização em `scripts/image-assets.ts`.

O menu desktop aparece em telas largas e o menu mobile é aberto pelo botão no canto direito. Os links e o CTA são definidos no Google Docs; o comportamento responsivo pertence ao componente Astro.

### Hero

O Hero usa uma tabela com uma linha de configuração. A imagem pode ser uma URL pública ou uma imagem colada na célula correspondente:

| hero | | | | | | | |
| --- | --- | --- | --- | --- | --- | --- | --- |
| eyebrow | título inicial | destaque | continuação do título | descrição | imagem | texto alternativo | legenda |

Exemplo:

| hero | | | | | | | |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bem-vindo ao Santuário | Um lugar de | Fé | Esperança e Amor | O Santuário Nossa Senhora de Nazaré é um espaço sagrado de fé e espiritualidade. | imagem da igreja | Fachada do Santuário Nossa Senhora de Nazaré | Santuário Nossa Senhora de Nazaré — Cohatrac |

O campo `destaque` aparece em dourado e itálico. A imagem pode ser colada diretamente no Google Docs; durante `npm run sync:google`, ela é baixada, convertida para WebP e salva localmente em `public/images/`.

### Horários de missas

Use o identificador `mass-schedule` (ou `missas`) na primeira linha. A primeira linha de dados define título, descrição e observação. As linhas seguintes usam três colunas: grupo, dia e horário. O componente agrupa automaticamente as linhas com o mesmo grupo e não solicita local, pois todas as celebrações acontecem na mesma igreja.

| mass-schedule | | |
| --- | --- | --- |
| Horários das Missas | Venha participar das celebrações eucarísticas. | Os horários podem sofrer alterações em celebrações especiais. |
| Presenciais | Segunda a Sexta-feira | 6h30 e 18h |
| Presenciais | Sábado | 6h30 e 17h |
| Presenciais | Domingo | 6h30, 9h, 17h e 19h |
| Transmitidas | Segunda a Sexta-feira | 18h |
| Transmitidas | Sábado | 17h |
| Transmitidas | Domingo | 9h e 19h |

O resultado é uma seção com cartões por grupo, adaptada para telas menores. Não inclua uma coluna de local.

### Fragmentos reutilizáveis

Crie uma pasta `fragmentos` dentro da pasta raiz do Drive. Dentro dela, crie uma pasta para cada fragmento, como `header` e `footer`, e coloque o documento correspondente dentro da pasta. Por exemplo:

```text
fragmentos/
└── header/
	└── header (Google Docs)
```

Essa estrutura gera `src/content/fragments/header/index.json`. O documento usa o mesmo contrato de blocks das páginas. O sincronizador também aceita documentos diretamente dentro de `fragmentos`, usando o nome do documento como nome do fragmento.

Na página que deve usar um fragmento, adicione uma tabela cuja primeira linha seja `fragment` e cuja primeira célula da segunda linha contenha o nome do fragmento:

| fragment | |
| --- | --- |
| header | |

A referência usa o caminho do documento dentro de `fragmentos`, sem a extensão do arquivo. Para documentos diretamente dentro da pasta, use apenas o nome, como `header`. A referência pode aparecer em qualquer posição e o mesmo fragmento pode ser usado em várias páginas.

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
