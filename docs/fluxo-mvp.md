# Etapa 3 — Protótipo do fluxo

O protótipo permite revisar conteúdo, hierarquia e navegação em quatro telas. Os dados são exemplos fixos; não há autenticação, persistência, upload, contagem de exportações ou cobrança.

## Caminhos

```text
Início → Começar agora → Acesso → Explorar painel → Painel → Novo visual → Editor
Início → Conhecer o editor → Editor
Editor → Voltar aos meus visuais → Painel
```

A navegação no cabeçalho é um auxílio de revisão do protótipo. Ela não representa controle de acesso e deve ser substituída quando as rotas autenticadas forem implementadas.

| Tela | Rota | O que revisar |
| --- | --- | --- |
| Início | `/` | Proposta do produto, exemplo vertical, chamada para testar e preço explicitamente hipotético. |
| Acesso | `/entrar` | Alternância entre entrar e criar conta; campos desabilitados, sem coleta de credenciais. |
| Painel | `/painel` | Exemplo de visual, entrada para novo visual e alternância entre lista e estado vazio. |
| Editor | `/editor` | Preview, app, ícone, título, mensagem, horário e fundo; salvar e baixar estão desabilitados. |

## Organização no celular

As páginas usam uma coluna em telas de até 760 px. O preview vem antes dos campos no editor, permitindo entender o resultado antes de configurar a notificação. No computador, os campos ficam à esquerda e o preview à direita, acompanhando a rolagem. O exemplo mantém proporção 9:16, sem representar um PNG já exportado.

## Roteiro de revisão

1. Abra `/`, siga **Começar agora** até os planos e escolha **Começar com FREE**. Alterne **Entrar** e **Criar conta**, verificando que nenhum campo pode receber credenciais.
2. Use **Explorar painel de demonstração**. Alterne **Ver painel vazio** e **Mostrar exemplo**.
3. Abra o exemplo ou use **Novo visual**. Confira a notificação, a ordem dos campos e os avisos de ações indisponíveis.
4. Volte ao painel e ao início. Teste também o atalho **Conhecer o editor**.
5. Repita a navegação em largura de celular (390 px, incluindo uma conferência a 320 px) e computador (1280 px). Confira ausência de rolagem horizontal, legibilidade e foco visível ao usar Tab.

## Direção visual

Referência atual: https://geradormarketing.com. Landing completa com abertura, indicadores do produto, recursos, vitrine ilustrativa de ícones, composição de demonstração, passo a passo, exemplos de uso, planos FREE/PRO e FAQ expansível. Paleta original restaurada: fundo preto #080808, cartões #121212, amarelo #efc532 e branco. Botões, destaques, ícones ilustrativos e wallpaper seguem essa paleta, preservando o layout. Marca Notivy centralizada, tipografia Segoe UI e cantos arredondados. Os textos refletem o escopo do Notivy; números de clientes, avaliações e vídeos da referência não são apresentados como resultados próprios. Os ícones da vitrine são ilustrativos. Estilos da landing em app/landing.css; paleta interna em app/globals.css. Planos e exportação continuam demonstrativos, sem cobrança. Nenhum commit ou push nesta revisão.

## Próximo incremento

A etapa 4 tornará o editor utilizável sem conta: estado temporário, preview em tempo real e geração do PNG de 1080 × 1920 px. A aparência do exemplo atual é provisória. Login real, banco de dados, Storage e pagamento seguem o roadmap posterior.



## Separação entre site público e área do cliente

A landing `/` apresenta recursos, demonstrações, como funciona e planos. Os CTAs públicos levam aos planos ou à seleção `/assinar?plano=free|pro`; não abrem painel ou editor. O rodapé mantém “Já sou cliente” para retorno ao acesso. A seleção mostra o plano e explica a futura confirmação de pagamento do PRO ou ativação gratuita do FREE. Só um link explicitamente demonstrativo simula a próxima etapa de acesso, sem efetuar compra ou ativação.

Em `/entrar` aparecem entrada e primeiro acesso, sem abas de painel e editor. Essas abas pertencem apenas às telas internas `/painel` e `/editor`. A separação é de navegação nesta etapa 3: URLs internas ainda são acessíveis diretamente. Autenticação e autorização no servidor, confirmação de pagamento e vínculo entre plano e conta serão implementados posteriormente. Não usar ocultação de links como proteção de acesso.

Roteiro atualizado: landing → planos → seleção FREE/PRO → simulação de acesso → painel → editor; retorno de clientes pelo rodapé. Conferir também a ausência de links diretos ao painel/editor na landing e na navegação de acesso.

## Indicadores e avaliações de exemplo

Faixa com quatro indicadores no formato da referência enviada em 17/09 e seção de avaliações com nota geral ilustrativa 4,9/5 e três perfis fictícios. Avisos visíveis identificam números, compatibilidade, nota e depoimentos como exemplos do protótipo; não são métricas reais nem depoimentos verificados. Substituir pelos dados reais antes de apresentar como prova social do produto.

## Vitrine de ícones

A seção pública de ícones usa a imagem de referência enviada em 17/09, armazenada em `public/images/icones-notivy.jpeg`. A landing informa que nomes e símbolos pertencem às respectivas marcas e são exemplos visuais. Antes da versão real, confirmar quais marcas poderão ser oferecidas no editor e substituir a composição estática por ativos individuais autorizados.

## Celular 3D e tamanho do horário

O preview compartilhado agora inclui uma moldura de celular em CSS com profundidade, reflexos, botões laterais, ilha superior, barra de status, câmera, lanterna e indicador inferior. Data e horário usam uma tipografia estreita e leve inspirada na referência enviada em 17/09. No editor, o tamanho do horário pode ser ajustado de 75% a 130% com botões ou controle deslizante; este é o único ajuste ao vivo habilitado nesta etapa do protótipo.
