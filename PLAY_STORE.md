# Checklist de publicação — Google Play

Tudo nesta página é para copiar e colar no Play Console. O app é publicado **apenas em português (Brasil)**.

- **Package:** `com.lucasluchetta.regame`
- **Versão inicial:** 1.0.0 (`versionCode` 1, incrementado automaticamente pelo EAS)
- **Política de privacidade:** `https://rega-me.<conta>.workers.dev/privacy-policy` (preencher depois do deploy)
- **E-mail de contato:** lucasluchetta1997@gmail.com

---

## 1. Publicar o site no Cloudflare Pages (antes de preencher a ficha)

O Play exige que a URL da política esteja no ar antes da submissão. A pasta `docs/` é a
raiz do site: `index.html` (apresentação), `privacy-policy.html`, `404.html`, `style.css`,
favicons, `_headers` e `_redirects`.

O site é servido pelo runtime de **static assets** da Cloudflare, configurado em
`wrangler.jsonc` na raiz do repositório: a pasta `docs/` inteira vira o site, sem
Worker e sem etapa de build.

1. Faça o merge do PR para o `main`.
2. No painel da Cloudflare: **Workers & Pages → Create → Connect to Git**, escolha o
   repositório `rega-me` e a branch `main`.
3. Configuração do build:
   - **Build command:** *(deixe vazio — é HTML estático)*
   - **Deploy command:** `npx wrangler deploy` (é o padrão que o painel já sugere)
   - **Root directory:** `/` — o `wrangler.jsonc` é que aponta para `docs/`
4. Deploy. A URL sai como `https://rega-me.<sua-conta>.workers.dev`.
5. Confirme que estes endereços abrem:
   - `/` — página inicial
   - `/privacy-policy` — **esta é a URL que vai no Play Console**
   - `/privacidade` — deve redirecionar para a anterior
6. Anote a URL final no topo deste arquivo e no campo *Política de privacidade* da ficha.

Cada push no `main` republica o site. Para um domínio próprio depois: **Settings → Domains
& Routes → Add** no projeto do Worker.

Para conferir o site localmente antes de subir: `npx wrangler dev`.

### Se a Cloudflare publicar o app em vez do site

Sintoma: a URL abre o app em vez da política. Causa: ao conectar o repositório, a Cloudflare
detecta o `expo` no `package.json`, assume que é um projeto de front-end e preenche sozinha um
build command (algo como `npx expo export`), publicando o `dist/` do app.

Correção em **Settings → Build** do projeto:

| Campo | Valor correto |
| --- | --- |
| Build command | **vazio** — apague o que a Cloudflare sugeriu |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Framework preset | `None` |

Depois salve e use **Deployments → Retry deployment** (ou faça um push novo). Um deploy correto
mostra no log algo como `Read 9 files from the assets directory .../docs` e **nenhuma** menção a
`expo export` ou `Metro`.

Se o painel insistir em reinjetar o build command, uma alternativa é apontar **Root directory**
para `docs` e mover o `wrangler.jsonc` para dentro dela com `"directory": "./"` — assim a
Cloudflare nem enxerga o `package.json` do app.

---

## 2. Ficha da loja (Store listing)

**Nome do app** (máx. 30)

```
Rega-me: lembrete de plantas
```

**Descrição curta** (máx. 80)

```
Lembretes simples de rega e cuidados para cada planta da sua casa.
```

**Descrição completa** (máx. 4000)

```
O Rega-me é o caderninho de cuidados do seu jardim — simples, bonito e sem complicação.

Cadastre suas plantas, diga com que frequência cada uma precisa de atenção e deixe que o app avise você na hora certa. Nada de conta, nada de anúncios: tudo fica guardado no seu próprio celular.

🌱 CADA PLANTA DO SEU JEITO
Registre nome, espécie, ambiente da casa, tipo de vaso e uma foto. Organize por cômodo — quarto, sala, cozinha, varanda — e veja num relance quem está precisando de você.

💧 LEMBRETES QUE FAZEM SENTIDO
Rega, adubo, poda, borrifada, troca de vaso e defensivo: cada cuidado tem sua própria frequência. As notificações chegam no ritmo de cada planta, e você pode adiar, antecipar ou marcar como feito com um toque.

📅 A SEMANA INTEIRA NA MÃO
O calendário mostra o que vem pela frente nos próximos dias, para você se organizar antes de viajar ou aproveitar o fim de semana para cuidar de tudo de uma vez.

📖 ENCICLOPÉDIA DE PLANTAS
Na hora de cadastrar, busque entre centenas de espécies e o app já sugere uma frequência de rega adequada. Você confere e ajusta como preferir.

🌤️ O CLIMA DO SEU DIA
Com sua permissão, o app mostra a temperatura e a umidade atuais e avisa quando o calor pede uma atenção extra. A localização é usada só para isso, enquanto o app está aberto.

📷 A HISTÓRIA DO SEU JARDIM
Guarde fotos ao longo do tempo e acompanhe o histórico de cuidados de cada planta. É bonito ver o quanto elas cresceram.

🔒 SEUS DADOS SÃO SEUS
Sem cadastro, sem login, sem anúncios, sem rastreadores. Suas plantas, fotos e anotações ficam apenas no seu aparelho.

Feito para quem tem uma suculenta na janela ou uma floresta na sala.
```

**Categoria:** Estilo de vida · **Tags:** plantas, jardinagem, lembretes
**Site:** `https://rega-me.<conta>.workers.dev/`

> ⚠️ Não descreva a busca da enciclopédia como "identificação por foto" ou "IA": o app preenche os
> dados a partir de uma lista local escolhida por você. Alegação enganosa é motivo de reprovação.

---

## 3. Assets gráficos

| Item | Requisito | Onde está |
| --- | --- | --- |
| Ícone | 512×512 PNG, sem transparência | `brand/store/play-icon-512.png` ✅ |
| Feature graphic | 1024×500 PNG/JPG | ⬜ a produzir |
| Screenshots de celular | mín. 2 (recomendado 4–8), lado menor ≥ 320 px | ⬜ capturar do APK de preview |

Sugestão de screenshots: Dashboard com tarefas do dia, galeria de plantas, detalhe de uma planta,
calendário da semana.

---

## 4. Formulário de segurança dos dados (Data Safety)

Respostas exatas, conferidas contra o código do app.

**O app coleta ou compartilha algum dos tipos de dados obrigatórios?** → **Sim**
(por causa da localização enviada ao serviço de clima)

**Todos os dados coletados são criptografados em trânsito?** → **Sim** (HTTPS)
**Você oferece um jeito de o usuário pedir a exclusão dos dados?** → **Sim** — desinstalar o app ou limpar os dados apaga tudo; não há cópia em servidor.

### Tipos de dados

| Tipo | Coletado | Compartilhado | Finalidade | Obrigatório? |
| --- | --- | --- | --- | --- |
| **Localização aproximada** | Sim | Não | Funcionalidade do app (previsão do tempo) | Opcional |
| **Localização precisa** | Sim | Não | Funcionalidade do app (previsão do tempo) | Opcional |

Para os dois: marque **"Os dados não são armazenados"** (processados de forma efêmera) — as
coordenadas são usadas na consulta e descartadas; só o resultado do clima fica em cache local.

### O que **NÃO** declarar como coletado

Fotos, nome, informações do perfil e dados das plantas **não** são coletados: nunca saem do aparelho.
O Play só considera "coleta" o que é transmitido para fora do dispositivo.

### Demais declarações do console

| Pergunta | Resposta |
| --- | --- |
| O app contém anúncios? | Não |
| O app tem conteúdo gerado por usuários? | Não |
| App de notícias / COVID / finanças / governo? | Não |
| Acesso restrito (login) para o revisor? | Não — todas as telas ficam abertas |
| Público-alvo | 13 anos ou mais (não direcionado a crianças) |
| Classificação de conteúdo | Questionário do IARC → resultado esperado: **Livre** (sem violência, sexo, drogas, apostas, compras ou interação entre usuários) |

---

## 5. Sequência de publicação

1. **Validar em aparelho real** com o APK interno:
   `npx eas build --platform android --profile preview`
2. **Criar o app** no Play Console (nome, idioma padrão pt-BR, gratuito) e preencher ficha,
   Data Safety, classificação de conteúdo e público-alvo.
3. **Service account** para envio automatizado: Play Console → *Configurações → Acesso via API →
   criar conta de serviço no Google Cloud → conceder permissão de "Administrador de versões" →
   baixar a chave JSON* e salvar na raiz do projeto como `play-store-key.json`
   (já está no `.gitignore` — **nunca** faça commit dela).
4. **Build de produção (AAB):**
   `npx eas build --platform android --profile production`
   Na primeira execução o EAS cria a keystore. Faça backup: `npx eas credentials`.
   Perder essa chave impede qualquer atualização futura do app.
5. **Enviar:** `npx eas submit --platform android --profile production`
   (vai para a trilha de **teste interno** como rascunho).
6. Testar pela trilha interna e, se estiver tudo certo, promover para produção no console.

> ⚠️ **Contas pessoais de desenvolvedor** criadas a partir de nov/2023 precisam de **12 testers
> por 14 dias seguidos** na trilha de teste fechado antes de liberar produção. Se for o seu caso,
> comece o teste fechado o quanto antes — é o item que mais atrasa lançamentos.

---

## 6. Atualizações futuras

O `versionCode` é incrementado automaticamente (`autoIncrement` no perfil de produção, com
`appVersionSource: "remote"`). Ao lançar uma nova versão, atualize apenas o `version` em `app.json`
(ex.: `1.1.0`) e rode build + submit novamente.
