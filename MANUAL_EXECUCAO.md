# Manual de Execução e Geração de APK — Meu Bolso

Este aplicativo é desenvolvido exclusivamente em **React Native com Expo (SDK 58)**. Não requer nenhuma instalação de Java, Kotlin, Gradle, Maven ou Android Studio no seu computador. Tudo funciona diretamente pelo ecossistema Expo.

---

## 1. Testar o Aplicativo via Expo Go (Recomendado)

Você pode testar o app instantaneamente em qualquer smartphone (Android ou iOS) ou emulador.

### Passo 1: Instalar o aplicativo Expo Go no celular
- Abra a **Google Play Store** (no Android) ou a **App Store** (no iPhone) e instale o aplicativo gratuito **Expo Go**.

### Passo 2: Instalar as dependências no projeto
No terminal, dentro da pasta do projeto:
```bash
npm install
```

### Passo 3: Iniciar o servidor de desenvolvimento
```bash
npm start
```

### Passo 4: Abrir o aplicativo no celular
1. Um QR Code será exibido no terminal.
2. Certifique-se de que o computador e o smartphone estejam na mesma rede Wi-Fi (ou use `npx expo start --tunnel` caso esteja em redes diferentes ou dados móveis).
3. No celular Android, abra o **Expo Go** e toque em **"Scan QR code"** para ler o código do terminal.
4. O app **Meu Bolso** será carregado imediatamente no seu celular com atualização em tempo real (Fast Refresh ao salvar qualquer alteração de código).

> **Dica**: No terminal do `npm start`, você pode:
> - Pressionar `a` para abrir no Android.
> - Pressionar `r` para recarregar o aplicativo.
> - Pressionar `j` para abrir as ferramentas de depuração.

---

## 2. Gerar APK Independente pelo Expo (EAS Build)

A compilação do APK é realizada diretamente pelos servidores em nuvem do Expo através do **EAS Build**. Não é necessário ter SDK, JDK, Gradle ou ferramentas nativas no seu computador.

### Passo 1: Fazer login no Expo / EAS
```bash
npx eas-cli login
```
*(Caso não possua conta gratuita no Expo, crie em [expo.dev/signup](https://expo.dev/signup)).*

### Passo 2: Gerar o APK
```bash
npm run build:apk
```
*(ou `npx eas-cli build -p android --profile preview`)*

O EAS Build irá:
1. Validar e empacotar seu código React Native;
2. Compilar o aplicativo na nuvem com o perfil de distribuição APK (`eas.json`);
3. Ao finalizar, fornecer o link direto e o QR Code para download e instalação do arquivo `.apk` em qualquer celular Android.

---

## 3. Comandos do Projeto

| Comando | Descrição |
| :--- | :--- |
| `npm start` | Inicia o servidor Expo para testes via Expo Go. |
| `npm run android` | Inicia o servidor Expo direcionado para o emulador/dispositivo Android. |
| `npm run build:apk` | Inicia a compilação do APK independente na nuvem pelo EAS Build. |
| `npm run doctor` | Executa o `expo-doctor` verificando a integridade das dependências do Expo. |
| `npm run lint` | Valida o código com o linter oficial do Expo (`expo lint`). |

---

## 4. Diagnóstico

- **Verificação de Saúde do Projeto**:
  ```bash
  npm run doctor
  ```
  Informa se todas as bibliotecas e arquivos de configuração estão 100% alinhados com o Expo SDK 58.
- **Rede corporativa ou Wi-Fi com isolamento**:
  Se o Expo Go não conectar ao Metro pelo Wi-Fi local, utilize o modo túnel:
  ```bash
  npx expo start --tunnel
  ```
