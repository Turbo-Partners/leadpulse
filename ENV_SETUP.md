# Configuração das Variáveis de Ambiente

Para que o projeto funcione corretamente, você precisa configurar as variáveis de ambiente do Supabase.

## Passos para Configurar

1. **Crie um arquivo `.env` na raiz do projeto**

2. **Adicione as seguintes variáveis:**

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

## Como Obter as Credenciais

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Settings** > **API**
4. Copie os seguintes valores:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

## Exemplo de Configuração

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0NzIwMCwiZXhwIjoxOTUyMTIzMjAwfQ.example
```

## Importante

- Nunca commite o arquivo `.env` no repositório
- O arquivo `.env` já está no `.gitignore`
- Sem essas variáveis, a autenticação não funcionará
- Você verá erros como "Invalid login credentials" se as variáveis não estiverem configuradas

## Testando a Configuração

Após configurar as variáveis:

1. Reinicie o servidor de desenvolvimento: `npm run dev`
2. Tente fazer login com credenciais válidas
3. Verifique se não há erros no console do navegador 