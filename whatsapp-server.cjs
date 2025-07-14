const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5174", // URL do seu frontend Vite
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// WhatsApp client
let whatsappClient = null;
let qrCodeData = null;
let isConnected = false;

// Inicializar cliente WhatsApp
function initializeWhatsApp() {
  whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  // Evento quando QR Code é gerado
  whatsappClient.on('qr', async (qr) => {
    console.log('QR Code gerado');
    qrCodeData = await qrcode.toDataURL(qr);
    io.emit('qr-code', qrCodeData);
  });

  // Evento quando cliente está pronto
  whatsappClient.on('ready', () => {
    console.log('WhatsApp conectado!');
    isConnected = true;
    qrCodeData = null;
    io.emit('connected', true);
  });

  // Evento quando cliente é desconectado
  whatsappClient.on('disconnected', () => {
    console.log('WhatsApp desconectado');
    isConnected = false;
    io.emit('connected', false);
  });

  // Evento quando recebe mensagem
  whatsappClient.on('message', async (message) => {
    console.log('Mensagem recebida:', message.body);
    
    // Emitir mensagem para todos os clientes conectados
    io.emit('new-message', {
      id: message.id._serialized,
      from: message.from,
      body: message.body,
      timestamp: message.timestamp,
      type: message.type,
      chat: {
        id: message.chat.id._serialized,
        name: message.chat.name || message.chat.id.user
      }
    });
  });

  // Inicializar cliente
  whatsappClient.initialize();
}

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar status atual
  socket.emit('status', { isConnected, qrCodeData });

  // Enviar QR Code se disponível
  if (qrCodeData) {
    socket.emit('qr-code', qrCodeData);
  }

  // Evento para enviar mensagem
  socket.on('send-message', async (data) => {
    if (!isConnected || !whatsappClient) {
      socket.emit('error', 'WhatsApp não está conectado');
      return;
    }

    try {
      const chatId = data.chatId.includes('@c.us') ? data.chatId : `${data.chatId}@c.us`;
      const message = await whatsappClient.sendMessage(chatId, data.message);
      
      socket.emit('message-sent', {
        id: message.id._serialized,
        chatId: data.chatId,
        message: data.message,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      socket.emit('error', 'Erro ao enviar mensagem');
    }
  });

  // Evento para obter conversas
  socket.on('get-chats', async () => {
    if (!isConnected || !whatsappClient) {
      socket.emit('error', 'WhatsApp não está conectado');
      return;
    }

    try {
      const chats = await whatsappClient.getChats();
      const formattedChats = chats.map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user,
        lastMessage: chat.lastMessage?.body || '',
        timestamp: chat.lastMessage?.timestamp || Date.now(),
        unreadCount: chat.unreadCount || 0
      }));

      socket.emit('chats', formattedChats);
    } catch (error) {
      console.error('Erro ao obter conversas:', error);
      socket.emit('error', 'Erro ao obter conversas');
    }
  });

  // Evento para obter mensagens de uma conversa
  socket.on('get-messages', async (data) => {
    if (!isConnected || !whatsappClient) {
      socket.emit('error', 'WhatsApp não está conectado');
      return;
    }

    try {
      const chatId = data.chatId.includes('@c.us') ? data.chatId : `${data.chatId}@c.us`;
      const chat = await whatsappClient.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit: 50 });

      const formattedMessages = messages.map(msg => ({
        id: msg.id._serialized,
        from: msg.from,
        body: msg.body,
        timestamp: msg.timestamp,
        type: msg.type,
        isFromMe: msg.fromMe
      }));

      socket.emit('messages', formattedMessages);
    } catch (error) {
      console.error('Erro ao obter mensagens:', error);
      socket.emit('error', 'Erro ao obter mensagens');
    }
  });

  // Evento para desconectar WhatsApp
  socket.on('disconnect-whatsapp', () => {
    if (whatsappClient) {
      whatsappClient.destroy();
      whatsappClient = null;
      isConnected = false;
      io.emit('connected', false);
    }
  });

  // Evento para reconectar WhatsApp
  socket.on('reconnect-whatsapp', () => {
    if (!whatsappClient) {
      initializeWhatsApp();
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Rotas HTTP
app.get('/api/status', (req, res) => {
  res.json({ isConnected, qrCodeData });
});

app.post('/api/send-message', async (req, res) => {
  if (!isConnected || !whatsappClient) {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }

  try {
    const { chatId, message } = req.body;
    const fullChatId = chatId.includes('@c.us') ? chatId : `${chatId}@c.us`;
    const sentMessage = await whatsappClient.sendMessage(fullChatId, message);
    
    res.json({
      success: true,
      messageId: sentMessage.id._serialized
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

app.get('/api/chats', async (req, res) => {
  if (!isConnected || !whatsappClient) {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }

  try {
    const chats = await whatsappClient.getChats();
    const formattedChats = chats.map(chat => ({
      id: chat.id._serialized,
      name: chat.name || chat.id.user,
      lastMessage: chat.lastMessage?.body || '',
      timestamp: chat.lastMessage?.timestamp || Date.now(),
      unreadCount: chat.unreadCount || 0
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error('Erro ao obter conversas:', error);
    res.status(500).json({ error: 'Erro ao obter conversas' });
  }
});

// Inicializar WhatsApp quando servidor iniciar
initializeWhatsApp();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`Frontend deve estar rodando em: http://localhost:5174`);
}); 