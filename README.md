<div align="center">

<img src="brand/store/play-icon-512.png" alt="Rega-me" width="120">

# Rega-me

**O caderninho de cuidados do seu jardim.**

Um app de lembretes de rega, adubo e poda para as plantas da sua casa.
Sem conta, sem anúncios, sem servidor: tudo fica guardado no seu próprio celular.

[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-000?logo=expo&logoColor=white)](https://expo.dev)
[![React Native 0.81](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-5D8C7B)](LICENSE)
[![Offline first](https://img.shields.io/badge/offline-first-536343)](#-privacidade-por-construção)

[A ideia](#-a-ideia) · [Recursos](#-o-que-o-app-faz) · [Rodar localmente](#-rodando-em-5-minutos) · [Gerar o APK](BUILD.md) · [Contribuir](CONTRIBUTING.md)

</div>

---

## 🌱 A ideia

Quase todo app de plantas quer virar rede social: pede cadastro, sobe suas fotos para
algum servidor, mostra anúncio e tenta te vender uma assinatura para lembrar que a
samambaia precisa de água.

O Rega-me é o contrário disso. Ele parte de três decisões simples:

1. **O dado é seu e fica no seu aparelho.** Um banco SQLite local guarda plantas,
   tarefas, histórico e fotos. Não existe login, não existe API do app, não existe
   sincronização. Desinstalou, acabou.
2. **Cada planta tem seu ritmo.** Rega, adubo, poda, borrifada, troca de vaso e
   defensivo são cuidados independentes, cada um com sua própria frequência. A
   notificação chega quando aquela planta específica precisa — não numa agenda genérica.
3. **Precisa ser bonito de usar.** A interface é calma de propósito: paleta sage/clay,
   tipografia serifada nos títulos, formas orgânicas em vez de retângulos duros. É um
   app que você abre de manhã com o café, não um painel de produtividade.

O único dado que sai do aparelho é a coordenada aproximada enviada à
[Open-Meteo](https://open-meteo.com) para mostrar o clima do dia — e mesmo isso é
opcional e sem chave de API.

## ✨ O que o app faz

| | |
| --- | --- |
| 🪴 **Cada planta do seu jeito** | Nome, espécie, cômodo, tamanho e material do vaso, drenagem e foto. |
| 💧 **Seis tipos de cuidado** | Rega, adubo, poda, borrifada, troca de vaso e defensivo — cada um com sua frequência. |
| 🔔 **Lembretes locais** | Notificações agendadas no aparelho pelo `expo-notifications`. Concluir, adiar ou antecipar com um toque. |
| 📅 **Orakul: a semana à frente** | Uma agenda dos próximos 14 dias para se organizar antes de viajar. |
| 📖 **Enciclopédia offline** | 209 espécies com nome popular, família, clima e frequência de rega sugerida — tudo em JSON local. |
| 🌤️ **Clima do dia** | Temperatura e umidade via Open-Meteo, com cache local de 30 minutos. |
| 📷 **Histórico visual** | Várias fotos por planta ao longo do tempo, para acompanhar o crescimento. |
| 🏠 **Organização por cômodo** | Quarto, sala, cozinha, varanda — cada ambiente com sua própria tela. |

## 🧱 Como é feito

```
App.js ──> AppNavigator ──> telas (Dashboard, AddPlant, PlantDetails, RoomDetail, Orakul, Profile)
                │
                ├── PlantContext ......... estado global das plantas e tarefas
                ├── PlantDAO / TaskDAO ... acesso ao SQLite (expo-sqlite)
                ├── NotificationService .. agendamento dos lembretes locais
                └── WeatherService ....... Open-Meteo + cache no AsyncStorage
```

| Camada | Escolha |
| --- | --- |
| Runtime | Expo SDK 54 · React Native 0.81 · React 19 · Nova arquitetura ligada |
| Linguagem | TypeScript (telas e serviços) |
| Navegação | React Navigation 7 (bottom tabs + native stack) |
| Estilo | `twrnc` (Tailwind no React Native) + paleta própria em `tailwind.config.js` |
| Dados | `expo-sqlite` — 4 tabelas: `plants`, `tasks`, `history`, `plant_photos` |
| Ícones | `lucide-react-native`, importados um a um para não inflar o bundle |

### Estrutura de pastas

```
src/
  components/    AnimatedSplash, CircularProgress
  contexts/      PlantContext — o coração do estado
  database/      db.ts, PlantDAO, TaskDAO, plants_pt.json (enciclopédia)
  i18n/          textos (pt-BR fixo)
  navigation/    AppNavigator
  screens/       uma pasta por tela
  services/      NotificationService, WeatherService
  utils/         tw.ts, imageStorage.ts, shape.ts
assets/          ícones e splash gerados a partir de brand/
brand/           arte-fonte 1024×1024
scripts/         generate-assets.js — regera os ícones a partir da arte-fonte
```

## 🚀 Rodando em 5 minutos

Você precisa de **Node 20+**, **pnpm** (ou npm) e o app **Expo Go** no celular.

```bash
git clone https://github.com/LucasLuchetta/rega-me.git
cd rega-me
pnpm install
pnpm start          # leia o QR code com o Expo Go
```

Notificações e câmera funcionam parcialmente no Expo Go; para o comportamento real,
gere um build de desenvolvimento (veja o [guia de build](BUILD.md)).

```bash
pnpm android        # abre no emulador/aparelho Android
pnpm ios            # abre no simulador iOS (macOS)
npx tsc --noEmit    # checagem de tipos
```

## 📲 Baixar o APK pronto

O APK de cada versão é compilado automaticamente e publicado em
**[Releases](https://github.com/LucasLuchetta/rega-me/releases)**. Baixe o `.apk` no
celular, abra pelo gerenciador de arquivos e autorize a instalação de fontes
desconhecidas quando o Android pedir.

Quem forkar o projeto ganha o mesmo: o workflow
[`build-apk.yml`](.github/workflows/build-apk.yml) compila e publica a release sozinho a
cada tag `v*`, sem precisar de nada instalado na sua máquina.

```bash
git tag v1.0.0 && git push origin v1.0.0
```

## 🔨 Gerando o seu APK

O projeto foi pensado para ser forkado e compilado. O **[BUILD.md](BUILD.md)** ensina o
caminho completo até um APK instalável: o que trocar no fork (nome, ícone, package),
como compilar na sua própria máquina com o Gradle e como regerar os assets a partir da
sua arte.

Caminho curto, compilando localmente:

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
# APK em android/app/build/outputs/apk/release/app-release.apk
```

## 🔒 Privacidade por construção

- Nenhuma conta, nenhum login, nenhum analytics, nenhum anúncio, nenhum rastreador.
- Plantas, tarefas, anotações e fotos vivem só no SQLite e no armazenamento do aparelho.
- A localização é usada apenas com o app aberto, enviada à Open-Meteo e descartada —
  só o resultado do clima fica em cache local por 30 minutos.
- Permissão de localização em segundo plano, escrita externa e reconhecimento de
  atividade são **bloqueadas** explicitamente em `app.json`.

Não há servidor para vazar dados porque não há servidor.

## 🤝 Contribuindo

Issues e PRs são bem-vindos. Leia o [CONTRIBUTING.md](CONTRIBUTING.md) para o padrão de
commits (mensagens em português, no imperativo), o estilo de código e o que rodar antes
de abrir um PR.

## 📄 Licença

[MIT](LICENSE) © 2026 Lucas Luchetta. Open source de verdade: use, modifique, forke e
redistribua à vontade, inclusive comercialmente — basta manter o aviso de copyright.

A marca "Rega-me", o logotipo e a arte em `brand/` não estão incluídos na licença — se
for publicar seu fork, use um nome e um ícone próprios.

<div align="center">

Feito para quem tem uma suculenta na janela ou uma floresta na sala. 🌿

</div>
