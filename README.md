# Isprotec Assistencia Tecnica

Sistema de gerenciamento para assistencia tecnica em impressoras, com modo local e preparacao para operar online com Supabase + Netlify.

## Como abrir

Abra o arquivo `index.html` no navegador. Sem Supabase configurado, o sistema funciona sem instalacao e salva os dados no `localStorage` do proprio navegador.

Para publicar online, veja `SUPABASE_NETLIFY.md` e `DEPLOY_ONLINE.md`.

## Modulos

- Painel com OS abertas, atrasos, graficos da fila tecnica, alertas de estoque e resultado do mes.
- Ordens de Servico com cliente, equipamento, diagnostico, servicos editaveis com custo e valor final, pecas, status, pagamento, impressao e exclusao em lote.
- Agenda tecnica por data e carga por tecnico.
- Clientes e equipamentos.
- Usuarios por funcao: tecnico, atendente e administrador.
- Login local por e-mail e senha dos usuarios cadastrados, ou login online pelo Supabase Auth quando configurado.
- Estoque com preco de custo, preco de venda, minimo e entrada de compras.
- Fluxo de caixa com entradas, saidas, pendentes, baixas e resultado mensal.
- Relatorios por mes, categoria financeira e etapa das OS.
- Importacao de OS por JSON de outros sistemas.
- Backup JSON para exportar e importar dados.

## Observacoes

- A primeira abertura cria dados de exemplo para demonstracao.
- Use `Configuracoes > Exportar backup` antes de limpar dados do navegador ou trocar de computador.
- A baixa de pecas acontece quando a OS entra em `Em reparo`, `Pronto` ou `Entregue`.
- Telas com listas possuem selecao por checkbox e exclusao em lote. Registros vinculados a OS sao preservados para manter o historico consistente.
- Usuarios de exemplo usam senha inicial `1234`; altere em `Configuracoes > Usuarios e permissoes`.
- OS, vendas e lancamentos so entram em receita, lucro e relatorios financeiros quando estiverem com status `Pago`.

## Importar OS por JSON

Na tela `Ordens de Servico`, use `Importar OS JSON`.

O arquivo pode ser uma lista direta de OS ou um objeto com uma lista em campos como `orders`, `ordens`, `os`, `serviceOrders` ou `ordensDeServico`.

Campos comuns reconhecidos: `numero`, `cliente`, `equipamento`, `defeito`, `diagnostico`, `solucao`, `status`, `prioridade`, `tecnico`, `entrada`, `prazo`, `mao_de_obra`, `desconto`, `pago` e `pecas`.
