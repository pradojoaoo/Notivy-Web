# Notivy

Ferramenta web para criar imagens de notificações personalizadas para stories, vídeos e outros criativos de marketing. A pessoa edita a composição no navegador, acompanha o preview e baixa um PNG. O Notivy **não envia nem agenda notificações reais** no iPhone ou Android.

## Estado do projeto

O projeto está na **etapa 4 do MVP: editor utilizável sem conta**. A landing page e as rotas de planos, acesso e painel formam um fluxo demonstrativo. O editor permite alterar o visual em tempo real e gerar um PNG vertical de **1080 × 1920 px**, com wallpaper e notificação na mesma imagem. A exportação usa a área interna do preview; a moldura decorativa do telefone fica fora do arquivo.

| Área | Situação atual |
| --- | --- |
| Landing `/` | Apresenta o produto, exemplos visuais, recursos, planos propostos e FAQ. |
| Editor `/editor` | Funciona sem conta, com estado temporário no navegador e exportação PNG. |
| Planos `/assinar?plano=free` e `/assinar?plano=pro` | Seleção demonstrativa; nenhuma ativação ou compra é realizada. |
| Acesso `/entrar` | Campos desabilitados; não coleta credenciais nem cria contas. |
| Painel `/painel` | Exemplo fixo e estado vazio para revisão; não salva visuais. |

As rotas de painel e editor são acessíveis diretamente. A navegação atual não implementa autenticação nem autorização. As alterações do editor se perdem ao recarregar a página.

## Recursos do editor

- Um layout vertical inspirado na tela bloqueada de um iPhone, com preview em tempo real.
- Edição de nome e ícone do app, título, mensagem e horário exibido na notificação.
- Edição de data e horários da tela, fonte, cor, peso, tamanho e espaçamento do relógio.
- Posições prontas ou posição livre da notificação, ajustável por controles ou arrastando no preview.
- Um ícone pronto de exemplo e envio de logo e wallpaper próprios em PNG, JPEG ou WebP.
- Restauração do exemplo inicial e download do PNG; em celulares compatíveis, opção de compartilhar o arquivo.

O horário mostrado na arte é apenas texto. Os uploads são usados localmente durante a sessão e não são enviados a um servidor pelo editor.

## Planos propostos

| Plano | Hipótese comercial |
| --- | --- |
| FREE | 3 exportações por mês por conta. |
| PRO | Exportações ilimitadas por R$19,90/mês. |

Esses planos **não estão ativos**. Não há cobrança, contas ou bloqueio por limite de exportações. O preço e as regras ainda precisam ser validados com usuários antes da implementação.

## Tecnologia e organização

O projeto usa Next.js 16 com App Router, React 19 e `modern-screenshot`. O build gera um site estático em `out/` por meio de `output: "export"` em `next.config.js`.

```text
app/
  page.jsx                 landing page
  landing.css              estilos da landing
  globals.css              estilos compartilhados e telas internas
  layout.jsx               metadados e estrutura comum
  _components/             preview, navegação demonstrativa e animação visual
  _lib/export-preview.js   geração do PNG a partir do preview
  editor/
    page.jsx               estado do editor e ação de exportar
    _components/           controles do editor
    _lib/                  valores padrão do editor
  assinar/ entrar/ painel/  demais rotas
public/images/             imagens usadas no protótipo
docs/fluxo-mvp.md          fluxo e roteiro de revisão
```

Os diretórios iniciados por `_` dentro de `app/` organizam código que não representa uma rota. `.openai/hosting.json` aponta a hospedagem estática para `out/`; sua presença não confirma uma publicação ativa.

## Executar localmente

Use Node.js 20.9 ou mais recente:

```powershell
npm ci
npm run dev
```

Abra `http://localhost:3000`. Para verificar o código e gerar a versão estática:

```powershell
npm run lint
npm run build
```

Neste computador há também um Node.js portátil na pasta ignorada `.node/`. Se `npm` não estiver no `PATH`, habilite essa cópia apenas no terminal atual:

```powershell
$env:Path = (Resolve-Path '.\.node\node-v24.19.0-win-x64').Path + ';' + $env:Path
npm.cmd run dev
```

## Próximas etapas

1. Validar visualmente a correspondência entre preview e PNG em diferentes navegadores e celulares, incluindo logos e wallpapers enviados pelo usuário.
2. Implementar contas, controle de acesso, persistência dos visuais e armazenamento dos arquivos, caso esses recursos sejam confirmados para o produto.
3. Validar e implementar limites do FREE, assinatura PRO e confirmação de pagamento.
4. Substituir exemplos de avaliações e ícones de marcas por conteúdo e ativos autorizados antes do lançamento comercial.

O [roteiro de revisão](docs/fluxo-mvp.md) descreve os caminhos do protótipo e os testes manuais recomendados.
