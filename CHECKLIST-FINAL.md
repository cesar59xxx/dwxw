# CHECKLIST FINAL - O QUE FAZER AGORA

## PASSO 1: VERIFICAR RAILWAY

- [ ] Abrir Railway > Variables
- [ ] Confirmar que `SUPABASE_SERVICE_ROLE_KEY` existe
- [ ] Confirmar que o valor tem ~250+ caracteres
- [ ] Confirmar que começa com `eyJhbGci`

## PASSO 2: SE NÃO TIVER A VARIÁVEL

1. Vá em https://supabase.com/dashboard/project/ldieqcofmincppqzownw/settings/api
2. Procure "service_role" (role: service_role)
3. Clique "Reveal"
4. Copie a chave COMPLETA
5. No Railway, adicione variável:
   - Nome: `SUPABASE_SERVICE_ROLE_KEY`
   - Valor: [cole a chave]
6. Clique "Save"
7. Aguarde redeploy (1-2 min)

## PASSO 3: TESTAR

1. Acesse: https://novo-222-production.up.railway.app/api/test/supabase
2. Deve retornar `"success": true` e `"hasKey": true`

## PASSO 4: CRIAR SESSÃO

1. Vá em https://novo-222.vercel.app/whatsapp
2. Clique "Nova Sessão"
3. Digite um nome
4. Clique "Criar Sessão"
5. Aguarde 5 segundos
6. Vá no Supabase e ATUALIZE a página
7. A sessão DEVE aparecer na tabela!

## SE AINDA NÃO FUNCIONAR

Me mostre:
1. Screenshot das variáveis do Railway (pode esconder os valores)
2. Resultado de `/api/test/supabase`
3. Console do navegador ao criar sessão
4. Logs do Railway (Deploy Logs)
