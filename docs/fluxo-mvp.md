# Fluxo do MVP — etapa 4 publicada

> A versão publicada ainda representa este fluxo demonstrativo. No código local, a etapa 5 já começou com Supabase Auth, projetos salvos e RLS. Consulte o README para o estado mais recente do desenvolvimento.

O editor pode ser testado sem conta. Os campos alteram o preview imediatamente e a ação **Baixar PNG** gera uma imagem vertical de 1080 × 1920 px. Planos, login e painel ainda são demonstrações; nenhum plano é ativado e nenhum visual é salvo.

## Rotas e caminhos

| Rota | Função atual |
| --- | --- |
| `/` | Apresentar o produto e levar diretamente ao editor ou aos planos propostos. |
| `/editor` | Editar, pré visualizar e exportar uma composição sem conta. |
| `/assinar?plano=free` ou `?plano=pro` | Mostrar o plano selecionado; compra e ativação desabilitadas. |
| `/entrar` | Simular entrada e primeiro acesso sem receber credenciais. |
| `/painel` | Mostrar um exemplo fixo ou um estado vazio. |

```text
Início → Testar o editor → Editar → Baixar PNG
Início → Planos → Seleção demonstrativa → Acesso demonstrativo → Painel → Editor
```

O editor e o painel podem ser abertos por URL. Os links de navegação não são uma barreira de acesso; autenticação e autorização ainda não foram implementadas.

## O que revisar no editor

1. Altere nome do app, título, mensagem e horário exibido; confirme a atualização imediata no preview.
2. Ajuste data, horários e estilo do relógio. Teste também uma posição pronta e a posição livre da notificação.
3. Envie um logo e um wallpaper em PNG, JPEG ou WebP e confira ambos no preview.
4. Baixe o PNG e confira dimensões de 1080 × 1920 px, textos, imagens e posição dos elementos. A moldura decorativa do celular não deve aparecer no arquivo.
5. Use **Restaurar exemplo** e confirme que os valores e as imagens iniciais retornam.
6. No celular, confira o fluxo de compartilhamento ou use o link de download alternativo quando ele aparecer.

Repita a revisão em larguras próximas de 320 px, 390 px e 1280 px, observando legibilidade, rolagem horizontal e foco visível ao navegar com Tab. No celular, o preview aparece antes dos campos; no computador, fica ao lado deles.

## Limites e conteúdo ilustrativo

- O estado do editor vive apenas na página atual e se perde ao recarregar.
- O painel não mostra arquivos reais e não oferece salvar, duplicar ou excluir.
- FREE com 1 exportação mensal e PRO ilimitado por R$19,90/mês são hipóteses. Nenhum limite ou pagamento está ativo.
- A vitrine pública de marcas é uma imagem ilustrativa; o editor oferece um ícone pronto de exemplo e aceita logo enviado pelo usuário.
- A seção de avaliações usa perfis e notas fictícios, identificados na página. Não representam prova social do produto.
- A composição imita uma tela bloqueada apenas como imagem. Não dispara notificações reais.

## Próximo incremento

Após a validação visual do PNG, a próxima etapa de produto é definir a experiência com contas e visuais salvos. Controle de exportações e pagamento dependem da confirmação das regras comerciais e da implementação de autenticação, armazenamento e cobrança.
