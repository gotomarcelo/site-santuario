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

| header | | | |
| --- | --- | --- | --- |
| Santuário | Nossa Senhora de Nazaré | Contribuir | #dizimo |
| Início | / |
| A Paróquia | /a-paroquia/ |
| Missas | /missas/ |

O menu desktop aparece em telas largas e o menu mobile é aberto pelo botão no canto direito. Os links e o CTA são definidos no Google Docs; o comportamento responsivo pertence ao componente Astro.

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
