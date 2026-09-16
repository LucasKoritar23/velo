# Entrega: arquitetura de ambientes

## Objetivo

A aplicacao utiliza ambientes independentes para Preview e Production, garantindo que os testes E2E sejam executados em uma base isolada e que o deploy de producao utilize as configuracoes corretas.

## Ambientes Supabase

Como evidencia da separacao dos ambientes, foram utilizados dois projetos Supabase distintos:

| Ambiente | Supabase Project ID | Aplicacao |
|---|---|---|
| Preview | `krmzejefcznkedurejcx` | Deploy de Preview utilizado pelos testes E2E |
| Production | `hiniabexvmirzqjhxzfn` | https://velo-korittech.vercel.app/ |

Essa separacao evita que dados criados durante os testes sejam gravados no banco de producao.

### Evidencias de identificacao

- Project ID Supabase Preview: `krmzejefcznkedurejcx`
- Project ID Supabase Production: `hiniabexvmirzqjhxzfn`
- URL do ambiente produtivo: https://velo-korittech.vercel.app/

## Configuracao local

O arquivo `.env` da raiz define o ambiente utilizado localmente:

```env
PLAYWRIGHT_ENV=preview
```

O Playwright carrega automaticamente o arquivo correspondente em `environments/`:

```text
environments/preview.env
```

Para Production, basta alterar o seletor:

```env
PLAYWRIGHT_ENV=production
```

Os arquivos versionados sao apenas modelos de configuracao:

- `environments/preview.env.example`
- `environments/production.env.example`

Os arquivos reais `preview.env` e `production.env` ficam ignorados pelo Git e armazenam as configuracoes locais de cada ambiente.

## Variaveis de ambiente

As variaveis `VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estao configuradas por ambiente na Vercel. Cada ambiente possui seus proprios valores, fazendo com que a aplicacao se conecte ao projeto Supabase correspondente em Preview ou Production.

A variavel `DATABASE_URL` e configurada no GitHub Actions e utilizada pelos testes E2E para acessar diretamente a base de dados do ambiente de teste. Dessa forma, a URL de conexao e mantida fora do codigo-fonte e dos arquivos versionados.

Nenhuma variavel com credenciais fica exposta no repositorio. As variaveis sensiveis ficam protegidas nos mecanismos de configuracao de cada plataforma:

- Localmente, nos arquivos `.env` de cada ambiente.
- Na Vercel, separadas entre Preview e Production.
- No GitHub Actions, por meio de secrets e variables do repositorio.

## Pipeline de CI/CD

O workflow `.github/workflows/cd.yml` organiza o processo em etapas:

### 1. Testes unitarios

O projeto instala as dependencias e executa os testes unitarios antes de qualquer deploy.

### 2. Build e deploy Preview

O pipeline:

1. Vincula o projeto Vercel.
2. Carrega as variaveis do ambiente Preview com `vercel pull --environment=preview`.
3. Gera o build com `vercel build --target=preview`.
4. Publica o artefato com `vercel deploy --prebuilt --target=preview`.
5. Disponibiliza a URL do deploy para a proxima etapa.

Como o build Preview recebe as variaveis Preview da Vercel, a aplicacao publicada utiliza o projeto Supabase de Preview.

### 3. Testes E2E

Os testes recebem a URL do deploy Preview por meio da variavel `BASE_URL` e executam:

```bash
yarn playwright test
```

No ambiente CI, o Playwright nao inicia o servidor local. A configuracao de `webServer` e ativada somente quando `process.env.CI` nao esta definido. Dessa forma, os testes validam diretamente a aplicacao publicada no ambiente Preview.

A `DATABASE_URL` utilizada nessa etapa aponta para a base de Preview, mantendo os dados dos testes isolados da Production.

### 4. Build e deploy Production

A etapa de Production depende da conclusao dos testes E2E e executa:

1. Carregamento das variaveis Production com `vercel pull --environment=production`.
2. Build de producao com `vercel build --prod`.
3. Deploy do artefato com `vercel deploy --prebuilt --prod`.

O build de Production e separado do build Preview porque as variaveis `VITE_*` sao incorporadas ao bundle durante a compilacao. Assim, a aplicacao Production utiliza o projeto Supabase Production.

## Migrations e Edge Functions

As migrations e Edge Functions possuem uma fonte comum versionada no repositorio:

```text
supabase/migrations/
supabase/functions/credit-analysis/
```

Essa estrutura permite aplicar a mesma definicao de banco e a mesma implementacao da Edge Function nos projetos Supabase de Preview e Production.

## Resultado da arquitetura

A arquitetura implementada garante:

- Separacao entre os projetos Supabase de Preview e Production.
- Isolamento dos pedidos criados pelos testes E2E.
- Testes executados diretamente contra o deploy Preview.
- Build Production realizado com as variaveis Production.
- Aplicacao Production conectada ao banco Production.
- Configuracoes sensiveis fora do controle de versao.
- Migrations e Edge Functions mantidas em uma fonte comum no repositorio.
