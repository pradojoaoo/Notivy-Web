# Notivy

O Notivy é um editor web para criar **prints simulados de notificações** diretamente no navegador. O produto foi pensado para stories, campanhas, lançamentos, vendas, cursos, infoprodutos e conteúdos de influenciadores, sem exigir a instalação de um aplicativo no celular.

O usuário personaliza a tela, acompanha o resultado em tempo real e baixa um PNG vertical pronto para publicação. O Notivy cria somente a imagem e **não envia notificações reais**.

## Status atual

O **layout do MVP está pronto** e publicado para revisão:

**Site:** https://notivy-editor-joaov.k5yxq7p244.chatgpt.site/

| Área | Estado |
| --- | --- |
| Landing `/` | Layout final com posicionamento comercial, recursos, demonstrações, planos e FAQ. |
| Editor `/editor` | Funcional sem conta, com edição em tempo real e exportação PNG. |
| Painel `/painel` | Fluxo demonstrativo com exemplo e estado vazio. |
| Acesso `/entrar` | Interface demonstrativa; não coleta dados nem cria contas. |
| Planos `/assinar` | Fluxo demonstrativo; não realiza cobrança ou ativação. |
| Hospedagem | Publicação privada ativa pelo Sites, gerada a partir do build estático em `out/`. |

Na versão publicada, as páginas de conta, painel e assinatura representam o fluxo planejado. Autenticação, persistência, cobrança e limites reais ainda não estão ativos nesse endereço.

### Etapa 5 em desenvolvimento local

O código local já iniciou a evolução além da versão publicada:

- projeto gratuito do Supabase criado na região de São Paulo;
- cadastro, login, sessão e logout conectados ao Supabase Auth;
- tabela `notification_projects` criada com Row Level Security (RLS);
- painel conectado aos projetos do usuário autenticado;
- editor preparado para salvar e reabrir configurações;
- imagens enviadas pelo usuário ainda não são persistidas;
- cobrança e limite mensal de exportações continuam desativados.

Essas alterações ainda precisam de um teste completo com uma conta confirmada antes de uma nova publicação.

## Proposta da marca

- Criar prints realistas de notificações sem instalar aplicativo.
- Gerar peças para stories e campanhas em poucos minutos.
- Personalizar logo, nome do app, mensagem, horário, wallpaper e posição.
- Atender campanhas de vendas, cursos, lançamentos e marketing de influenciadores.
- Entregar um PNG pronto em **1080 × 1920 px**.

## Recursos do editor

- Preview vertical inspirado na tela bloqueada do iPhone.
- Edição de data, horários e relógio principal.
- Personalização de fonte, cor, peso, tamanho e espaçamento do relógio.
- Edição do nome do app, título, mensagem e horário da notificação.
- Posições prontas e posição livre, inclusive com arraste direto no preview.
- Upload local de logo e wallpaper em PNG, JPEG ou WebP.
- Galeria com 14 logos bancárias prontas.
- Exportação em PNG de 1080 × 1920 px.
- Download direto e compartilhamento em celulares compatíveis.
- Restauração rápida do exemplo inicial.

Os uploads permanecem somente na sessão do navegador e não são enviados para um servidor pelo editor.

## Logos disponíveis

- Nubank
- Banco do Brasil
- Santander
- Itaú
- Mercado Pago
- Caixa
- PicPay
- Neon
- Banco PAN
- Inter
- C6 Bank
- Sicoob
- Sicredi
- BTG Pactual

Ao selecionar uma logo pronta, o nome do banco também é preenchido automaticamente na notificação. O usuário pode substituir qualquer opção por uma imagem própria.

## Exportação PNG

A exportação utiliza `modern-screenshot` para capturar a tela e uma composição em Canvas para desenhar o vidro e o conteúdo da notificação de forma estável. Essa etapa evita faixas e marcas observadas em capturas feitas no Safari do iPhone.

O arquivo final:

- possui 1080 × 1920 px;
- mantém a proporção e a posição vistas no editor;
- inclui wallpaper, relógio, status, notificação e controles da tela;
- exclui a moldura decorativa externa do telefone;
- preserva logos personalizadas e imagens enviadas pelo usuário.

O primeiro clique inicia o download. Depois da geração, o editor também mantém um link de abertura e oferece compartilhamento quando o navegador permite.

## Planos apresentados no MVP

| Plano | Proposta |
| --- | --- |
| FREE | 1 exportação por mês por conta. |
| PRO | Exportações ilimitadas por R$19,90/mês. |

Os planos ainda são demonstrativos. O editor não aplica limites e não processa pagamentos nesta etapa.

## Tecnologia

- Next.js 16 com App Router
- React 19
- Supabase Auth e PostgreSQL
- `modern-screenshot` 4.7
- Canvas do navegador para a composição final da notificação
- ESLint 9
- Exportação estática do Next.js para `out/`
- Hospedagem pelo Sites

## Organização principal

```text
app/
  page.jsx                       landing page
  landing.css                    estilos da landing
  globals.css                    estilos compartilhados e telas internas
  layout.jsx                     metadados e estrutura global
  _components/
    notification-preview.jsx     telefone e notificação reutilizáveis
    prototype-shell.jsx          navegação das telas internas
    site-motion.jsx              animações da interface
  _lib/
    export-preview.js            geração do PNG final
  editor/
    page.jsx                     estado, uploads, download e compartilhamento
    _components/
      editor-controls.jsx        campos e galeria de logos
    _lib/
      editor-config.js           valores iniciais e logos disponíveis
  assinar/                       demonstração de planos
  entrar/                        demonstração de acesso
  painel/                        demonstração do painel
public/images/
  logos/                         logos bancárias do editor
.openai/hosting.json             configuração da publicação estática
```

## Executar localmente

Requer Node.js 20.9 ou mais recente.

```powershell
npm ci
npm run dev
```

Abra `http://localhost:3000`.

Para validar e gerar o site estático:

```powershell
npm run lint
npm run build
```

Neste computador também existe uma instalação portátil do Node.js na pasta ignorada `.node/`. Caso `npm` não esteja disponível no `PATH`:

```powershell
$env:Path = (Resolve-Path '.\.node\node-v24.19.0-win-x64').Path + ';' + $env:Path
npm.cmd run dev
```

## Validações realizadas

- Build estático completo das seis rotas.
- Lint do projeto.
- Exportação desktop e mobile em 1080 × 1920 px.
- Exportação com textos longos, posição livre e uploads personalizados.
- Seleção das 14 logos e preenchimento automático do nome do banco.
- Primeiro download e fallback para abrir o PNG.
- Ajuste do preview e do PNG para remover marcas laterais da notificação.

## Próximas etapas de produto

1. Testar cadastro, confirmação de e-mail, login e recuperação de senha de ponta a ponta.
2. Persistir logos e wallpapers personalizados no Supabase Storage.
3. Adicionar duplicação e exclusão de prints no painel.
4. Aplicar o limite real de 1 exportação mensal no FREE.
5. Integrar cobrança e assinatura do PRO.
6. Revisar licenças e autorizações de uso das marcas antes do lançamento comercial.

O código atual representa o MVP visual e funcional do editor, com o **layout pronto** para a próxima etapa de implementação do produto.
