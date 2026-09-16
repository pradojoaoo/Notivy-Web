# Notivy

Notivy é um projeto de ferramenta web para criar **visuais de notificações personalizadas** para stories, vídeos e outros criativos de marketing. A pessoa edita o visual no navegador, vê o resultado no preview e baixa uma imagem pronta para usar. O produto **gera uma imagem**: não envia, agenda nem simula o disparo de notificações nativas no iPhone ou Android.

## Corte do MVP

O primeiro resultado será um **PNG vertical completo de 1080 × 1920 px**, com fundo e notificação na mesma imagem. Essa é a única opção de formato definida para o primeiro editor. O arquivo exportado deverá corresponder ao preview.

Haverá **um único layout inicial**, inspirado na aparência de uma notificação do iPhone. O visual conterá fundo, ícone e nome do aplicativo, título, mensagem e horário **exibido**. O horário altera apenas o texto da imagem; não agenda um envio real. Os controles do editor devem servir a esse resultado, sem exigir outros layouts ou formatos para concluir a primeira versão utilizável.

A **exportação PNG é a prioridade do primeiro incremento**: editor, preview em tempo real e download poderão ser validados sem conta antes de adicionar autenticação, persistência e cobrança.

## Hipóteses comerciais

| Plano | Regra provisória de exportação |
| --- | --- |
| FREE | 3 exportações por mês por conta |
| PRO | Exportações ilimitadas |

Os dois planos terão os mesmos recursos visuais nesta proposta inicial. O preço de **R$19,90/mês para o PRO é uma hipótese**, não uma oferta validada. O limite do FREE será associado à conta quando houver autenticação. Os limites, a cobrança e o preço deverão ser testados com usuários e implementados nas etapas posteriores; o editor inicial sem conta pode validar preview e exportação antes de aplicar qualquer limite.

## Como conferir esta etapa

Este README é o resultado da etapa 1. Confira se o caso de uso, as dimensões e o conteúdo do PNG, o layout único e as hipóteses FREE/PRO estão claros. A ferramenta ainda não foi implementada; a correspondência entre preview e arquivo exportado será verificada quando o editor existir.

## Base do projeto

O projeto usa **Next.js com React e App Router**. A rota inicial em `app/page.jsx` é uma página provisória que confirma que a base está funcionando; o editor e a exportação serão construídos em etapas posteriores. `app/layout.jsx` define a estrutura comum e os metadados, e `app/globals.css` contém os estilos da página. `package.json` lista as dependências e os comandos. `.gitignore` impede que dependências, arquivos gerados e segredos entrem no Git.

Para rodar localmente, instale Node.js **20.9 ou mais recente** e, na pasta do projeto, execute:

```powershell
npm install
npm run dev
```

Abra `http://localhost:3000` no navegador. Para conferir a qualidade da base, execute `npm run lint` e `npm run build`. Depois de instalar as dependências, use o `package-lock.json` gerado para manter as versões reproduzíveis.
