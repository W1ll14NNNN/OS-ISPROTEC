# Site público ISPROTEC

O site público abre na raiz do domínio. O painel administrativo foi preservado em sistema.html.

## Variáveis no Netlify

Cadastre no Netlify as variáveis abaixo:

SUPABASE_URL = URL do projeto Supabase

SUPABASE_SERVICE_ROLE_KEY = chave secreta service role do Supabase

ISPROTEC_TENANT_ID = isprotec-main

A chave service role é secreta: ela deve ficar somente no painel do Netlify, nunca em supabase-config.js.

O formulário de agendamento cria uma OS de entrada. A consulta pública retorna somente o status da OS cujo número e telefone cadastrado coincidirem.
