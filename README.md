# Isprotec Assistência Técnica

Sistema local de gerenciamento para assistência técnica em impressoras.

## Como abrir

Abra o arquivo `index.html` no navegador. O sistema funciona sem instalação e salva os dados no `localStorage` do próprio navegador.

## Módulos

- Painel com OS abertas, atrasos, gráficos da fila técnica, alertas de estoque e resultado do mês.
- Ordens de Serviço com cliente, equipamento, diagnóstico, serviços editáveis com custo e valor final, peças, status, pagamento, impressão e exclusão em lote.
- Agenda técnica por data e carga por técnico.
- Clientes e equipamentos.
- Usuários por função: técnico, atendente e administrador.
- Login local por e-mail e senha dos usuários cadastrados.
- Estoque com preço de custo, preço de venda, mínimo e entrada de compras.
- Fluxo de caixa com entradas, saídas, pendentes, baixas e resultado mensal.
- Relatórios por mês, categoria financeira e etapa das OS.
- Importação de OS por JSON de outros sistemas.
- Backup JSON para exportar e importar dados.

## Observações

- A primeira abertura cria dados de exemplo para demonstração.
- Use `Configurações > Exportar backup` antes de limpar dados do navegador ou trocar de computador.
- A baixa de peças acontece quando a OS entra em `Em reparo`, `Pronto` ou `Entregue`.
- A imagem da marca está referenciada a partir da pasta Downloads informada no pedido. Se ela for movida, o sistema mostra o fallback textual.
- Telas com listas possuem seleção por checkbox e exclusão em lote. Registros vinculados a OS são preservados para manter o histórico consistente.
- Usuários de exemplo usam senha inicial `1234`; altere em `Configurações > Usuários e permissões`.
- OS, vendas e lançamentos só entram em receita, lucro e relatórios financeiros quando estiverem com status `Pago`.

## Importar OS por JSON

Na tela `Ordens de Serviço`, use `Importar OS JSON`.

O arquivo pode ser uma lista direta de OS ou um objeto com uma lista em campos como `orders`, `ordens`, `os`, `serviceOrders` ou `ordensDeServico`.

Campos comuns reconhecidos: `numero`, `cliente`, `equipamento`, `defeito`, `diagnostico`, `solucao`, `status`, `prioridade`, `tecnico`, `entrada`, `prazo`, `mao_de_obra`, `desconto`, `pago` e `pecas`.
