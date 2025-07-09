# Instruções para Aplicar a Migração do Histórico de Scraping

## Problema
O erro `relation "public.scraping_sessions" does not exist` indica que a tabela não foi criada no banco de dados.

## Solução

### Passo 1: Acessar o Supabase Dashboard
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto `ahpxakzodkhirviyjheh` (baseado na URL do erro)

### Passo 2: Abrir o SQL Editor
1. No menu lateral esquerdo, clique em **SQL Editor**
2. Clique em **New query** para criar uma nova consulta

### Passo 3: Executar a Migração
1. **Primeiro**: Copie todo o conteúdo do arquivo `apply_scraping_history_migration.sql`
2. Cole no SQL Editor e clique em **Run**
3. **Depois**: Copie todo o conteúdo do arquivo `complete_fix_scrapping_leads.sql`
4. Cole no SQL Editor e clique em **Run** novamente

### Passo 4: Verificar se Funcionou
1. Vá para **Table Editor** no menu lateral
2. Verifique se a tabela `scraping_sessions` foi criada
3. Verifique se a tabela `scrapping_leads` tem todas as colunas necessárias:
   - `id`, `business_type`, `state`, `city`, `neighborhood`, `company_name`, `phone`, `email`, `address`, `created_at`, `created_by`, `session_id`

### Passo 5: Reativar o Histórico no Código
✅ **Já foi feito automaticamente!** O código já está configurado para buscar o histórico.

### Passo 6: Testar o Sistema
1. Recarregue a página de Scrapping Map
2. O erro deve desaparecer
3. O botão "Ver Histórico" deve funcionar
4. Faça uma extração de teste para verificar se os dados são salvos corretamente

## Estrutura Criada

### Tabela `scraping_sessions`
- Armazena informações sobre cada sessão de scraping
- Campos: id, user_id, business_type, state, city, neighborhood, limit_requested, results_count, status, error_message, created_at, completed_at

### Coluna `session_id` na tabela `scrapping_leads`
- Liga os resultados às sessões
- Permite rastrear quais leads foram extraídos em qual sessão

### Políticas de Segurança (RLS)
- Cada usuário vê apenas suas próprias sessões
- Usuários só podem inserir/atualizar/excluir suas próprias sessões
- Resultados são vinculados às sessões do usuário

## Testando
Após aplicar as migrações:
1. Recarregue a página de Scrapping Map
2. Os erros `Could not find the 'company_name' column` e `Could not find the 'neighborhood' column` devem desaparecer
3. O botão "Ver Histórico" deve funcionar
4. Faça uma extração de teste para verificar se os dados são salvos corretamente
5. Verifique se os resultados aparecem no histórico

## Se Houver Problemas
1. Verifique se todas as políticas RLS foram criadas
2. Confirme que os índices foram criados
3. Teste uma consulta simples: `SELECT * FROM scraping_sessions LIMIT 1;` 