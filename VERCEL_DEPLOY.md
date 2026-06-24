# Publicar na Vercel

1. Envie as alterações deste projeto para o GitHub pelo GitHub Desktop.
2. Acesse https://vercel.com e entre com a mesma conta do GitHub.
3. Selecione **Add New > Project** e importe o repositório da ISPROTEC.
4. Em **Root Directory**, selecione a pasta `OS-ISPROTEC-main`, onde estão o `index.html` e a pasta `api`.
5. Em **Environment Variables**, cadastre estas três variáveis para Production:

| Nome | Valor |
| --- | --- |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta service_role do Supabase |
| `ISPROTEC_TENANT_ID` | `isprotec-main` |

6. Clique em **Deploy**.
7. Depois do status **Ready**, abra o link gerado pela Vercel e teste a consulta de OS e o agendamento.

As funções do portal ficam em `/api`. A chave `SUPABASE_SERVICE_ROLE_KEY` fica somente na Vercel, nunca no código do site.
