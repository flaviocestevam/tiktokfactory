# Auditoria do fluxo TikTok Factory — 2 de agosto de 2026

Produto usado no teste: `1731254692141565116`

## Resultado executivo

O aplicativo compila, mas o fluxo ainda não funciona de ponta a ponta com o produto testado.

| Etapa | Resultado |
|---|---|
| Build de produção | Aprovado |
| Validação do domínio TikTok | Aprovado |
| Extração do ID | Aprovado |
| Detecção da região BR | Aprovado após correção |
| Remoção de parâmetros de rastreamento | Aprovado |
| Abertura automática da página do produto | Bloqueada pelo TikTok |
| Extração de nome, preço e descrição | Reprovada |
| Confirmação automática do produto | Não pode ser validada |
| Seleção da personagem | Auditada estaticamente |
| Upload e análise da foto | Auditados estaticamente |
| Geração dos três roteiros | Auditada estaticamente |
| Divisão em clipes | Auditada estaticamente |
| Prompts do Google Flow | Auditados estaticamente |

## Teste real do produto

A URL foi normalizada para:

`https://shop.tiktok.com/br/pdp/1731254692141565116`

Resultado correto da normalização:

- `product_id`: `1731254692141565116`
- `country_code`: `BR`
- parâmetros `source`, `first_entrance` e `btm_*`: removidos da URL de leitura

O leitor anônimo retornou:

- título: `Security Check`
- mensagem: `Verify to continue`
- instrução: `Drag the puzzle piece into place`

Conclusão: o TikTok entregou um CAPTCHA, não a página de vendas. O leitor atual não recebeu nenhum campo comercial do produto.

Resultado final da extração:

- `ok`: `false`
- `status`: `blocked`
- `fonte`: `jina`
- campos extraídos: `0`

## Correção aplicada durante a auditoria

O normalizador aceitava um redirecionamento provocado pelo país do servidor. Um produto `/br/pdp/` podia virar a página inicial `/us`, perdendo o ID e o mercado corretos.

A correção trata país, ID e caminho de uma URL direta de produto como autoritativos. Links curtos continuam sendo resolvidos, mas uma URL direta com ID não pode ser substituída por uma página inicial de outro país.

## Falhas de fluxo encontradas

### Produto

- A interface ainda permite editar manualmente todos os campos, embora o processo definido seja totalmente automático.
- A confirmação exige apenas o nome; assim, um resultado parcial ou antigo pode avançar indevidamente.
- O status salvo é calculado pela presença de um aviso, em vez de usar o status real retornado pelo extrator.
- Metadados técnicos da extração não são persistidos integralmente.
- Os rótulos de preço atual e preço anterior precisam ser alinhados ao modelo de dados.

### Recomendação da personagem

Quando o produto não corresponde aos cinco nichos conhecidos, o código escolhe a primeira personagem da lista, embora informe que a categoria não foi classificada. Isso pode recomendar uma personagem errada para roupas, brinquedos, cozinha ou outras categorias.

### Foto da produção

- A foto da produção é enviada ao bucket `produtos`.
- O caminho do arquivo retornado pelo servidor é descartado no cliente.
- `reference_image_path` não é salvo.
- Excluir a foto na tela não remove o arquivo nem limpa os campos do projeto no banco.
- A tela considera a análise visual bem-sucedida apenas porque existe uma URL.
- A geração de roteiros pode continuar mesmo quando a análise multimodal falha.

### Roteiros

- O ajuste “MAIS CURTO” ainda menciona “duração alvo”, embora não exista duração alvo no negócio.
- A edição manual do roteiro não recalcula palavras, duração e plano de clipes.
- Algumas operações não validam simultaneamente o ID da produção e o ID do roteiro.

### Clipes

- Se a IA falhar ao gerar os prompts, o sistema ainda grava clipes com `prompt_flow` vazio e pode marcar a produção como `clipes_preparados`.
- Uma frase individual longa pode exceder a capacidade de um clipe de 10 segundos e continuar marcada apenas com `excede=true`, sem correção automática ou bloqueio.

## Requisito para a importação automática funcionar

O fallback anônimo não é suficiente para TikTok Shop. O sistema precisa de pelo menos um leitor de produto configurado e testado, como:

- navegador remoto com sessão e rota regional compatíveis; ou
- serviço de dados de TikTok Shop que aceite URL/ID e mercado.

Sem esse leitor, o sistema deve informar claramente `leitor não configurado` ou `TikTok bloqueou a leitura`, e nunca permitir confirmar um produto sem extração automática válida.

## Veredito

Estado atual: **não aprovado para produção de ponta a ponta**.

A base do fluxo, os prompts universais de produto, a análise visual e o planejamento dos clipes estão estruturados, mas a etapa inicial de importação falha no produto real testado. Como essa etapa bloqueia todas as seguintes, o fluxo completo ainda não pode ser considerado funcional.
