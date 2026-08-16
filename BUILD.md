# Montando a sua própria build do Rega-me

Este guia leva do `git clone` até um APK instalável no seu celular — e, se você quiser,
até uma versão publicável com o seu próprio nome. Não é preciso saber React Native para
seguir: os comandos estão na ordem.

Índice:

1. [Pré-requisitos](#1-pré-requisitos)
2. [Rodar no celular sem compilar nada](#2-rodar-no-celular-sem-compilar-nada)
3. [Personalizar o fork](#3-personalizar-o-fork)
4. [Build na nuvem com EAS (mais fácil)](#4-build-na-nuvem-com-eas-mais-fácil)
5. [Build 100% local, sem conta na Expo](#5-build-100-local-sem-conta-na-expo)
6. [Regerar ícones e splash a partir da sua arte](#6-regerar-ícones-e-splash-a-partir-da-sua-arte)
7. [Assinatura e publicação](#7-assinatura-e-publicação)
8. [Rodar o site de apresentação](#8-rodar-o-site-de-apresentação)
9. [Problemas comuns](#9-problemas-comuns)

---

## 1. Pré-requisitos

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| Node.js | 20 ou superior | tudo |
| pnpm | 9+ (`npm i -g pnpm`) | instalar dependências (npm também funciona) |
| Git | qualquer | clonar |
| Expo Go | app da loja | testar sem compilar |
| Android Studio + JDK 17 | só para build local | seção 5 |
| Xcode 16+ | só para iOS | macOS apenas |

```bash
git clone https://github.com/LucasLuchetta/rega-me.git
cd rega-me
pnpm install
```

O projeto **não** tem pastas `ios/` e `android/` versionadas: elas são geradas sob
demanda pelo `expo prebuild` a partir do `app.json`. É o fluxo "managed" do Expo — não
edite arquivos nativos direto, porque eles são recriados.

---

## 2. Rodar no celular sem compilar nada

```bash
pnpm start
```

Leia o QR code com o **Expo Go**. O app carrega em segundos e recarrega sozinho a cada
alteração de código.

**O que não funciona bem no Expo Go:** notificações agendadas (o Expo Go tem limitações
desde o SDK 53) e alguns comportamentos de câmera/arquivo. Para testar os lembretes de
verdade, gere um *development build*:

```bash
npx eas build --platform android --profile development
```

Instale o APK gerado e rode `pnpm start` normalmente — ele vai se conectar a esse app em
vez do Expo Go.

---

## 3. Personalizar o fork

Antes de gerar qualquer build sua, troque a identidade do app. Isso é obrigatório se
você pretende publicar: o `package` do Android é único no mundo.

**`app.json`**

```jsonc
{
  "expo": {
    "name": "Meu Jardim",              // nome sob o ícone
    "slug": "meu-jardim",              // identificador do projeto na Expo
    "version": "1.0.0",
    "ios":     { "bundleIdentifier": "com.seunome.meujardim" },
    "android": { "package":          "com.seunome.meujardim" },
    "extra":   { "eas": { "projectId": "..." } }   // apague: o EAS cria um novo
  }
}
```

**Cores e identidade visual**

- Paleta do app: `tailwind.config.js` (as famílias `sage`, `clay`, `canvas`…).
- Cores da splash e do ícone adaptativo: `app.json` → `plugins` → `expo-splash-screen`
  e `android.adaptiveIcon.backgroundColor`.
- Cor da notificação: `app.json` → plugin `expo-notifications` → `color`.
- Arte-fonte: `brand/logo-source.png` (1024×1024) — veja a seção 6.

**Textos**

- Interface: `src/i18n/pt.json`. O idioma é fixado em pt-BR em `src/i18n/index.ts`;
  para suportar outro idioma, adicione o JSON e registre em `resources`.
- Textos de permissão (o que o sistema mostra ao pedir foto/localização): `app.json`,
  nos plugins `expo-image-picker` e `expo-location`.

**Enciclopédia de plantas**

`src/database/plants_pt.json` (e `plants_en.json`) são listas simples. Cada item tem
nome latino, nomes populares, família, categoria, clima e faixa de temperatura. Adicione
ou remova espécies à vontade — é só JSON, não há build step.

---

## 4. Build na nuvem com EAS (mais fácil)

O EAS compila nos servidores da Expo. Tem plano gratuito com fila, e é o caminho mais
curto para um APK — funciona igual em Windows, macOS e Linux.

```bash
npm install -g eas-cli
eas login                       # crie uma conta grátis em expo.dev
eas init                        # cria o projectId novo no seu app.json
```

Os perfis já estão prontos em `eas.json`:

| Perfil | Comando | Resultado |
| --- | --- | --- |
| `development` | `eas build -p android --profile development` | APK com dev client, para desenvolver |
| `preview` | `eas build -p android --profile preview` | **APK instalável** — é o que você quer para usar no dia a dia |
| `production` | `eas build -p android --profile production` | AAB assinado, formato exigido pela Play Store |

```bash
eas build --platform android --profile preview
```

Ao final, o terminal mostra um link e um QR code. Baixe o APK no celular e instale
(será preciso permitir "instalar de fontes desconhecidas").

Para iOS, `eas build -p ios --profile preview` exige uma conta paga do Apple Developer
para instalar em aparelho físico; sem ela, use o simulador com o perfil
`--profile development` em um Mac.

---

## 5. Build 100% local, sem conta na Expo

Se você prefere não depender de serviço nenhum, dá para compilar na sua máquina.

**Requisitos:** JDK 17, Android SDK (Android Studio), variável `ANDROID_HOME` apontando
para o SDK.

```bash
npx expo prebuild --platform android --clean   # gera a pasta android/
cd android
./gradlew assembleRelease                      # no Windows: .\gradlew.bat assembleRelease
```

O APK sai em `android/app/build/outputs/apk/release/app-release.apk`.

Sem uma keystore configurada, o Gradle assina com a chave de debug: serve para instalar
no seu aparelho, **não** serve para publicar. Veja a seção 7 para assinar de verdade.

Alternativa com o próprio EAS rodando localmente (usa o `eas.json`, mas compila na sua
máquina, sem fila):

```bash
eas build --platform android --profile preview --local
```

> A pasta `android/` está no `.gitignore` de propósito. Se editar algo nativo à mão,
> lembre que `expo prebuild --clean` apaga tudo. O jeito certo de mudar configuração
> nativa é pelo `app.json` ou por um config plugin.

---

## 6. Regerar ícones e splash a partir da sua arte

Todos os PNGs de `assets/` são derivados de `brand/logo-source.png` (1024×1024) pelo
script `scripts/generate-assets.js`, que recorta a arte de dentro do círculo verde e
monta ícone, ícone adaptativo, ícone de notificação, favicon e splash.

```bash
pnpm add -D jimp-compact      # única dependência do script, não vem instalada
pnpm assets                   # regrava em assets/
pnpm assets ./saida           # ou escreve numa pasta de teste
```

Trocando a arte, ajuste no topo do script a geometria do círculo (`CX`, `CY`, `R`) e as
cores `GREEN`/`CREAM`, que são usadas para separar o desenho do fundo.

Se preferir ignorar o script, basta substituir manualmente os arquivos de `assets/`
mantendo os nomes e tamanhos: `icon.png` (1024²), `adaptive-icon.png` (1024², com
margem de segurança), `notification-icon.png` (96², branco sobre transparente),
`splash-icon.png` e `favicon.png`.

---

## 7. Assinatura e publicação

**Com EAS (recomendado):** na primeira build de produção, o EAS pergunta se pode gerar
a keystore. Aceite — e **faça backup imediatamente**:

```bash
eas credentials     # baixe e guarde a keystore em lugar seguro
```

Perder essa chave significa nunca mais poder atualizar o app publicado. Não existe
recuperação.

**Keystore própria, para build local:**

```bash
keytool -genkey -v -keystore minha-chave.keystore \
  -alias meu-app -keyalg RSA -keysize 2048 -validity 10000
```

Guarde-a fora do repositório (`*.jks` e `*.keystore` já são ignorados pelo Git) e
referencie-a em `android/gradle.properties` após o prebuild.

**Enviar para a Play Store:**

```bash
eas build  --platform android --profile production
eas submit --platform android --profile production
```

O perfil de submit espera uma chave de service account em `play-store-key.json` na raiz
(ignorada pelo Git). O passo a passo completo — ficha da loja, formulário de Data
Safety, classificação de conteúdo e a regra dos 12 testers por 14 dias — está em
[PLAY_STORE.md](PLAY_STORE.md).

> ⚖️ Ao publicar um fork, use nome e ícone próprios. A licença MIT cobre o código, não a
> marca "Rega-me" nem a arte de `brand/`.

---

## 8. Rodar o site de apresentação

O site é HTML estático em `docs/`, sem build step, servido pelo runtime de assets da
Cloudflare (configuração em `wrangler.jsonc`).

```bash
pnpm site:dev        # http://localhost:8787
pnpm deploy          # publica (precisa de conta Cloudflare + wrangler login)
```

---

## 9. Problemas comuns

| Sintoma | Causa e solução |
| --- | --- |
| `packages field missing or empty` no build da Cloudflare | O pnpm recriou `pnpm-workspace.yaml`. Apague-o; os build scripts permitidos ficam em `package.json` → `pnpm.onlyBuiltDependencies`. |
| Nenhuma notificação chega no APK de release | São as regras ProGuard do `expo-notifications` em `app.json`. Não as remova — sem elas o R8 quebra a serialização dos lembretes. |
| Metro com erro estranho depois de mexer em dependências | `npx expo start --clear` e, se persistir, apague `node_modules` e reinstale. |
| `expo prebuild` sobrescreveu meu código nativo | Esperado. Configuração nativa vai em `app.json` ou num config plugin. |
| Erros de TypeScript em `Orakul` e `Profile` | Pré-existentes, não bloqueiam a execução. PRs corrigindo são bem-vindos. |
| Build iOS falha em máquina Windows/Linux | iOS só compila em macOS (ou no EAS, que roda em Mac na nuvem). |
| Clima não aparece | Permissão de localização negada ou sem internet. A API (Open-Meteo) é aberta e não pede chave. |
