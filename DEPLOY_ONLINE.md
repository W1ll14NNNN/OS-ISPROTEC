# Publicar o Sistema Isprotec Online

Este projeto e um site estatico: `index.html`, `styles.css`, `app.js`, `supabase-config.js`, `netlify.toml`, `supabase/` e `assets/`.

## Caminho recomendado: Supabase + Netlify

O projeto ja esta preparado para:

- Netlify hospedar o sistema.
- Supabase Auth controlar login por e-mail e senha.
- Supabase Database guardar a base compartilhada online.

Siga o passo a passo em `SUPABASE_NETLIFY.md`.

## Modo local

Se `supabase-config.js` estiver vazio, o sistema continua funcionando no modo local com `localStorage`.

Nesse modo:

- Cada navegador tem seus proprios dados.
- Login, usuarios e senhas ficam apenas naquele navegador.
- E bom exportar backup em `Configuracoes` antes de trocar de computador.

## Publicar no Netlify

1. Suba estes arquivos para um repositorio GitHub.
2. Acesse https://app.netlify.com
3. Clique em **Add new site > Import an existing project**.
4. Escolha o repositorio.
5. Build command: deixe vazio.
6. Publish directory: `.`
7. Publique.

Arquivos importantes para enviar:

- `index.html`
- `app.js`
- `styles.css`
- `README.md`
- `DEPLOY_ONLINE.md`
- `SUPABASE_NETLIFY.md`
- `supabase-config.js`
- `netlify.toml`
- pasta `supabase`
- pasta `assets`

## Primeiro acesso local

Use:

```text
E-mail: willian@isprotec.com.br
Senha: 1234
```

No modo Supabase, crie os usuarios primeiro em **Authentication > Users** no painel do Supabase.
