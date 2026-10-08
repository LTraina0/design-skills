# Verificação técnica — versão 1.0

08/10/2026 · Execução local em Chrome Headless Shell, com Playwright. Os arquivos HTML foram abertos por `file://`, verificando também o uso sem servidor. Resultados detalhados: `validation-results.json`.

## Verificações realizadas

| Grupo | Resultado observado |
|---|---|
| Caminho de sucesso | Enter inicia processamento e conclui. Cliques/Enter/Espaço repetidos durante espera não criam outra tentativa. |
| Foco | Elemento principal permanece focado na transição; interromper retorna foco ao botão principal. |
| Calendário | Download `.ics` contém evento fictício e UTC correto: 14h30 Brasília → 17h30 UTC. |
| Falha recuperável | Primeira tentativa falha, mantém data/horário; retentativa manual conclui. |
| Timeout | Encerra em 6,5 segundos e mostra mensagem específica. |
| Resposta obsoleta | Inspeção de outro estado invalida a tentativa antiga; timer não sobrescreve o estado escolhido. |
| Disclosure | Preparo abre e fecha por Enter no summary nativo. |
| Movimento reduzido | Spinner e animações são removidos; texto de processamento permanece. |
| Alvos | Botões, select e summary têm altura de ao menos 44 CSS px. |
| Responsividade | Sem overflow horizontal em 320, 375, 768 e 1440 px, nos quatro estados. |
| Contraste | Pares principais de texto e foco entre 5,33:1 e 12,09:1; todos acima de 4,5:1. |
| JavaScript | Nenhum erro de runtime nos fluxos e exports verificados. |

As regiões `status` e `alert` existem desde o carregamento e ficam fora do article marcado `aria-busy`, permitindo que o anúncio de processamento não dependa do término da operação. Foi inspecionada a implementação programática; a fala efetiva em leitores de tela não foi avaliada nesta execução.

Inspeção visual das capturas: composição, legibilidade, quatro estados e apresentação editorial. O espaço do título e a altura mínima do componente foram estabilizados para preservar o contexto visual entre estados.

## Reprodução

Com Node e Playwright disponíveis, rode `node tests/verify.cjs`. Por padrão, o script usa `http://127.0.0.1:8000`; sirva a pasta com Python, ou defina `ELO_TEST_URL=file:///caminho/absoluto/elo-telemedicina`. Se necessário, indique um navegador compatível por `ELO_BROWSER_PATH`. O ambiente desta execução tinha Playwright no runtime compartilhado; `CODEX_PRIMARY_RUNTIME_NODE_MODULES` permite encontrá-lo sem dependência no protótipo.

Para regenerar o GIF depois dos testes: `python tests/make-gif.py` com Pillow instalado. Os testes regeneram os PNGs do componente e da apresentação. O protótipo entregue continua sem dependências de runtime.

## Limites

Não houve auditoria completa WCAG, teste manual com leitor de tela, avaliação com pacientes, teste de usabilidade, browser matrix ou backend de agendamento. Fluxos e critérios técnicos inspecionados não comprovam eficácia clínica, compreensão, aumento de conversão ou redução de faltas. O protótipo não possui persistência; recarregar reinicia a experiência.
