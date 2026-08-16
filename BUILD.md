# Montando o seu próprio APK do Rega-me

Este guia leva do `git clone` até um APK instalado no seu celular. Não é preciso saber
React Native para seguir: os comandos estão na ordem.

Índice:

1. [Pré-requisitos](#1-pré-requisitos)
2. [Rodar no celular sem compilar nada](#2-rodar-no-celular-sem-compilar-nada)
3. [Personalizar o fork](#3-personalizar-o-fork)
4. [Compilar o APK](#4-compilar-o-apk)
5. [Instalar no celular](#5-instalar-no-celular)
6. [Assinar com a sua própria chave](#6-assinar-com-a-sua-própria-chave)
7. [Regerar ícones e splash a partir da sua arte](#7-regerar-ícones-e-splash-a-partir-da-sua-arte)
8. [Problemas comuns](#8-problemas-comuns)

---

## 1. Pré-requisitos

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| Node.js | 20 ou superior | tudo |
| pnpm | 9+ (`npm i -g pnpm`) | instalar dependências (npm também funciona) |
| Git | qualquer | clonar |
| JDK | 17 | compilar o APK |
| Android SDK | via Android Studio | compilar o APK |
| Expo Go | app da loja | testar sem compilar (opcional) |

Depois de instalar o Android Studio, confirme que a variável `ANDROID_HOME` aponta para
o SDK (normalmente `~/Android/Sdk`, ou `%LOCALAPPDATA%\Android\Sdk` no Windows) e que
`java -version` responde 17.

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

Útil para experimentar o app ou desenvolver antes de gastar tempo com o build.

```bash
pnpm start
```

Leia o QR code com o **Expo Go**. O app carrega em segundos e recarrega sozinho a cada
alteração de código.

**O que não funciona bem no Expo Go:** notificações agendadas (limitação do Expo Go
desde o SDK 53) e alguns comportamentos de câmera/arquivo. Para testar os lembretes de
verdade, você precisa do APK — próximas seções.

---

## 3. Personalizar o fork

Troque a identidade do app antes de compilar. O `package` do Android é único por
aparelho: se você mantiver o original, seu APK conflita com o app oficial na hora de
instalar.

**`app.json`**

```jsonc
{
  "expo": {
    "name": "Meu Jardim",              // nome sob o ícone
    "slug": "meu-jardim",
    "version": "1.0.0",
    "ios":     { "bundleIdentifier": "com.seunome.meujardim" },
    "android": { "package":          "com.seunome.meujardim" },
    "extra":   { "eas": { "projectId": "..." } }   // pode apagar: só serve ao EAS
  }
}
```

**Cores e identidade visual**

- Paleta do app: `tailwind.config.js` (as famílias `sage`, `clay`, `canvas`…).
- Cores da splash e do ícone adaptativo: `app.json` → `plugins` → `expo-splash-screen`
  e `android.adaptiveIcon.backgroundColor`.
- Cor da notificação: `app.json` → plugin `expo-notifications` → `color`.
- Arte-fonte: `brand/logo-source.png` (1024×1024) — veja a seção 7.

**Textos**

- Interface: `src/i18n/pt.json`. O idioma é fixado em pt-BR em `src/i18n/index.ts`;
  para outro idioma, adicione o JSON e registre em `resources`.
- Textos de permissão (o que o sistema mostra ao pedir foto/localização): `app.json`,
  nos plugins `expo-image-picker` e `expo-location`.

**Enciclopédia de plantas**

`src/database/plants_pt.json` (e `plants_en.json`) são listas simples. Cada item tem
nome latino, nomes populares, família, categoria, clima e faixa de temperatura. Adicione
ou remova espécies à vontade — é só JSON, não há etapa de build.

---

## 4. Compilar o APK

Dois passos: gerar o projeto Android e rodar o Gradle.

```bash
npx expo prebuild --platform android --clean
cd android
./gradlew assembleRelease          # no Windows: .\gradlew.bat assembleRelease
```

O APK sai em:

```
android/app/build/outputs/apk/release/app-release.apk
```

A primeira compilação baixa o Gradle e as dependências nativas — pode levar de 10 a 30
minutos. As seguintes são bem mais rápidas.

**Variantes úteis**

| Comando | Quando usar |
| --- | --- |
| `./gradlew assembleRelease` | o APK que você quer: minificado, otimizado |
| `./gradlew assembleDebug` | compila mais rápido, app maior e mais lento, com menu de debug |
| `./gradlew clean` | quando o build começa a falhar por estado sujo |

Sem uma keystore configurada, o Gradle assina o release com a chave de debug. Isso é
suficiente para instalar no seu próprio aparelho. Para distribuir o APK para outras
pessoas, use uma chave sua — seção 6.

> A pasta `android/` está no `.gitignore` de propósito. Se editar algo nativo à mão,
> lembre que `expo prebuild --clean` apaga tudo. O jeito certo de mudar configuração
> nativa é pelo `app.json` ou por um config plugin.

---

## 5. Instalar no celular

**Por cabo**, com a depuração USB ligada no aparelho:

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Sem cabo:** copie o `.apk` para o celular (Drive, cabo, Telegram, o que preferir),
abra o arquivo pelo gerenciador de arquivos e autorize "instalar de fontes
desconhecidas" quando o Android pedir.

Se a instalação falhar com `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, é porque já existe no
aparelho um app com o mesmo `package` assinado com outra chave. Desinstale o antigo
primeiro — isso apaga os dados dele.

**Confira o que importa depois de instalar:** cadastre uma planta com frequência de 1
dia e veja se a notificação chega. Notificação é a parte que mais quebra em release, e
é o motivo das regras ProGuard que estão no `app.json`.

---

## 6. Assinar com a sua própria chave

Necessário se você vai distribuir o APK para outras pessoas, e obrigatório para
atualizar um app já instalado sem desinstalar.

```bash
keytool -genkey -v -keystore minha-chave.keystore \
  -alias meu-app -keyalg RSA -keysize 2048 -validity 10000
```

Guarde o arquivo **fora do repositório** (`*.jks` e `*.keystore` já são ignorados pelo
Git) e faça backup. Perder a chave significa não conseguir mais atualizar um app já
distribuído — não existe recuperação.

Depois do `prebuild`, declare a chave em `android/gradle.properties`:

```properties
MYAPP_UPLOAD_STORE_FILE=minha-chave.keystore
MYAPP_UPLOAD_KEY_ALIAS=meu-app
MYAPP_UPLOAD_STORE_PASSWORD=sua-senha
MYAPP_UPLOAD_KEY_PASSWORD=sua-senha
```

e aponte a `signingConfigs.release` do `android/app/build.gradle` para essas variáveis.
Como o `prebuild --clean` reescreve esses arquivos, o caminho durável é mover isso para
um config plugin ou reaplicar a cada regeneração.

---

## 7. Regerar ícones e splash a partir da sua arte

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

Se preferir ignorar o script, substitua manualmente os arquivos de `assets/` mantendo os
nomes e tamanhos: `icon.png` (1024²), `adaptive-icon.png` (1024², com margem de
segurança), `notification-icon.png` (96², branco sobre transparente), `splash-icon.png`
e `favicon.png`.

---

## 8. Problemas comuns

| Sintoma | Causa e solução |
| --- | --- |
| Nenhuma notificação chega no APK de release | São as regras ProGuard do `expo-notifications` em `app.json`. Não as remova — sem elas o R8 quebra a serialização dos lembretes. |
| `SDK location not found` | Falta `ANDROID_HOME`, ou crie `android/local.properties` com `sdk.dir=/caminho/para/Android/Sdk`. |
| Gradle falha com erro de versão de Java | Use JDK 17. Versões mais novas ainda quebram com o React Native 0.81. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Já existe um app com o mesmo `package` assinado com outra chave. Desinstale o antigo. |
| Metro com erro estranho depois de mexer em dependências | `npx expo start --clear` e, se persistir, apague `node_modules` e reinstale. |
| `expo prebuild` sobrescreveu meu código nativo | Esperado. Configuração nativa vai em `app.json` ou num config plugin. |
| Build trava ou estoura memória | `cd android && ./gradlew clean`, e aumente `org.gradle.jvmargs=-Xmx4g` em `android/gradle.properties`. |
| Erros de TypeScript em `Orakul` e `Profile` | Pré-existentes, não bloqueiam a execução nem o build. PRs corrigindo são bem-vindos. |
| Clima não aparece | Permissão de localização negada ou sem internet. A API (Open-Meteo) é aberta e não pede chave. |
