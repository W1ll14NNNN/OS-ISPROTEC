# Isprotec online com Supabase + Netlify

Este projeto agora pode trabalhar em dois modos:

- **Local:** abre direto pelo `index.html` e usa o armazenamento do navegador.
- **Online:** Netlify hospeda o sistema e Supabase cuida do login por e-mail/senha e da base compartilhada.

## 1. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie um novo projeto.
2. Abra **SQL Editor**.
3. Cole e execute o conteúdo de `supabase/schema.sql`.

## 2. Criar os usuários

1. No Supabase, vá em **Authentication > Users**.
2. Crie os usuários com e-mail e senha.
3. Depois que entrarem no sistema, ajuste o perfil em **Configurações > Usuários** para Administrador, Atendente ou Técnico.

O primeiro usuário que entrar em uma base vazia fica como Administrador automaticamente.

## 3. Conectar o sistema ao Supabase

No arquivo `supabase-config.js`, preencha:

```js
window.ISPROTEC_SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
window.ISPROTEC_SUPABASE_ANON_KEY = "SUA_CHAVE_ANON_PUBLICA";
window.ISPROTEC_TENANT_ID = "isprotec-main";
```

Esses dados ficam em **Project Settings > API** no Supabase.

## 4. Publicar no Netlify

1. Suba a pasta do projeto para o GitHub.
2. No Netlify, clique em **Add new site > Import an existing project**.
3. Escolha o repositório.
4. Build command: deixe vazio.
5. Publish directory: `.`.
6. Publique.

## Observação importante

Nesta primeira versão online, os dados ficam em uma linha JSON compartilhada no Supabase. Isso deixa o sistema online rapidamente sem reescrever tudo. A próxima evolução ideal é separar em tabelas próprias: clientes, equipamentos, OS, estoque, caixa, serviços e usuários.
