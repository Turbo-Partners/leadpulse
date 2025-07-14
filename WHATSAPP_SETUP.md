# Configuração do WhatsApp Web

Este projeto inclui uma integração completa com WhatsApp Web usando `whatsapp-web.js`.

## Pré-requisitos

- Node.js 16+ instalado
- NPM ou Yarn
- WhatsApp instalado no celular

## Instalação

As dependências já estão instaladas no projeto. Se precisar reinstalar:

```bash
npm install
```

## Como Executar

### Opção 1: Executar Separadamente

#### 1. Iniciar o Backend WhatsApp

Em um terminal, execute:

```bash
npm run whatsapp
```

O servidor WhatsApp será iniciado na porta 3001.

#### 2. Iniciar o Frontend

Em outro terminal, execute:

```bash
npm run dev
```

O frontend será iniciado na porta 5174.

### Opção 2: Executar Tudo Junto (Recomendado)

Para desenvolvimento, você pode executar ambos simultaneamente:

```bash
npm run dev:whatsapp
```

Isso iniciará tanto o frontend quanto o backend WhatsApp em um único comando.

### 3. Conectar WhatsApp

1. Acesse `http://localhost:5174` no navegador
2. Vá para a guia "WhatsApp"
3. Um QR Code será exibido
4. Abra o WhatsApp no seu celular
5. Vá em Configurações > WhatsApp Web
6. Escaneie o QR Code

## Funcionalidades

- ✅ Leitura de QR Code
- ✅ Lista de conversas em tempo real
- ✅ Envio e recebimento de mensagens
- ✅ Busca de conversas
- ✅ Interface similar ao WhatsApp Web
- ✅ Reconexão automática

## Estrutura do Projeto

```
├── whatsapp-server.cjs         # Backend Node.js/Express
├── src/
│   ├── hooks/
│   │   └── useWhatsApp.ts      # Hook para gerenciar conexão
│   └── pages/
│       └── WhatsApp.tsx        # Interface do WhatsApp
└── package.json
```

## Troubleshooting

### Erro de Conexão
- Verifique se o servidor está rodando na porta 3001
- Verifique se o frontend está rodando na porta 5174
- Certifique-se de que o WhatsApp está conectado à internet

### QR Code não aparece
- Clique em "Recarregar QR Code"
- Verifique os logs do servidor para erros
- Reinicie o servidor se necessário

### Mensagens não aparecem
- Verifique se o WhatsApp está conectado
- Clique em "Reconectar" se necessário
- Verifique os logs do console do navegador

## Logs do Servidor

O servidor exibe logs úteis no terminal:
- `QR Code gerado` - Quando um novo QR Code é criado
- `WhatsApp conectado!` - Quando a conexão é estabelecida
- `Mensagem recebida: [texto]` - Quando uma mensagem é recebida
- `Cliente conectado: [id]` - Quando um cliente web se conecta

## Segurança

⚠️ **Importante**: 
- O WhatsApp Web usa autenticação local
- Os dados de sessão são armazenados localmente
- Não compartilhe os arquivos de sessão
- Use apenas em ambientes seguros

## Desenvolvimento

Para desenvolvimento, você pode:
- Modificar `whatsapp-server.js` para adicionar novas funcionalidades
- Atualizar `useWhatsApp.ts` para novos eventos
- Personalizar `WhatsApp.tsx` para mudanças na interface 