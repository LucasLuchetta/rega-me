# Contribuindo com o Rega-me

Obrigado pelo interesse! Este é um projeto pequeno e pessoal, então a regra geral é:
issue antes de PR grande, e mudanças pequenas podem vir direto.

## Antes de começar

- **Bug ou ideia?** Abra uma issue descrevendo o que aconteceu (ou o que você gostaria)
  e em qual aparelho/versão do Android.
- **Mudança grande** (nova tela, troca de dependência, mudança de esquema do banco)?
  Abra uma issue primeiro para combinarmos o rumo antes de você gastar tempo.
- **Correção pequena** (typo, bug óbvio, acessibilidade)? Mande o PR direto.

## Ambiente

Veja o [BUILD.md](BUILD.md). Resumo:

```bash
pnpm install
pnpm start
```

## Estilo de código

- **TypeScript** em telas e serviços novos. `App.js` e `index.js` seguem em JS por
  razões históricas; não é preciso convertê-los num PR de outra coisa.
- **Estilo com `twrnc`**, usando a paleta de `tailwind.config.js` (`sage`, `clay`,
  `canvas`…). Evite valores hex soltos no meio das telas.
- **Ícones**: importe um a um de `lucide-react-native/dist/cjs/icons/<nome>`. Importar do
  pacote inteiro infla o bundle em vários MB.
- **Acesso ao banco** passa por `PlantDAO` / `TaskDAO`, nunca por SQL solto na tela.
- **Acessibilidade**: todo toque só com ícone precisa de `accessibilityLabel` e
  `accessibilityRole`; elementos com estado (abas, toggles) precisam de
  `accessibilityState`.
- **Logs**: envolva em `if (__DEV__)` para não vazarem em produção.
- **Textos visíveis** vêm de `src/i18n/pt.json`, não hardcoded na tela.

## Commits e PRs

- Mensagens de commit **em português, no imperativo**, seguindo o histórico do repo:
  `Corrige o agendamento de lembretes em release`, e não `fixed stuff`.
- Um assunto por PR. Descreva o que muda e, se for visual, anexe um print ou GIF.
- Antes de abrir:

```bash
npx tsc --noEmit    # não introduza erros novos
```

  O `Orakul` e o `Profile` já têm erros de tipo pré-existentes — não são culpa sua, mas
  não adicione mais.

- Teste num aparelho real ou emulador antes de marcar como pronto, principalmente se
  mexeu em notificações: o comportamento no Expo Go difere do build de release.

## Mudanças no banco

`src/database/db.ts` cria as tabelas com `CREATE TABLE IF NOT EXISTS` e não tem sistema
de migração. Se precisar alterar uma tabela existente, inclua no PR o `ALTER TABLE`
idempotente para quem já tem dados — quebrar o banco de um usuário não é uma opção.

## O que não entra

- Analytics, rastreadores, anúncios, crash reporting com envio automático.
- Qualquer coisa que exija conta, login ou servidor.
- Envio de fotos ou dados de plantas para fora do aparelho.

Isso não é rigidez à toa: é a promessa central do app. Se uma funcionalidade precisar quebrar essa promessa, ela precisa ser
opcional, explícita e documentada.

## Licença

Ao contribuir, você concorda em licenciar sua contribuição sob a [MIT](LICENSE).
