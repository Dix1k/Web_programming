const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data', 'boards.json');

if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

function readBoards() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function writeBoards(boards) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(boards, null, 2));
  } catch (error) {
    console.error('Error writing boards file:', error);
  }
}

const activeBoards = {};

io.on('connection', (socket) => {
  socket.on('join-board', (boardId) => {
    socket.join(boardId);
    
    if (!activeBoards[boardId]) {
      activeBoards[boardId] = {
        users: {},
        elements: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      };
      
      const boards = readBoards();
      if (boards[boardId]) {
        activeBoards[boardId].elements = boards[boardId].elements || [];
      }
    }
    
    const userId = uuidv4().substring(0, 8);
    activeBoards[boardId].users[socket.id] = {
      id: userId,
      name: `User${Object.keys(activeBoards[boardId].users).length + 1}`,
      cursor: { x: 0, y: 0 }
    };
    
    socket.emit('board-data', {
      elements: activeBoards[boardId].elements,
      users: activeBoards[boardId].users,
      viewport: activeBoards[boardId].viewport,
      yourId: socket.id,
      userId: userId
    });
    
    socket.to(boardId).emit('user-joined', {
      userId: socket.id,
      userData: activeBoards[boardId].users[socket.id]
    });
  });
  
  socket.on('element-create', (data) => {
    const { boardId, element } = data;
    if (activeBoards[boardId]) {
      activeBoards[boardId].elements.push(element);
      socket.to(boardId).emit('element-created', element);
    }
  });
  
  socket.on('element-update', (data) => {
    const { boardId, elementId, updates } = data;
    if (activeBoards[boardId]) {
      const index = activeBoards[boardId].elements.findIndex(el => el.id === elementId);
      if (index !== -1) {
        activeBoards[boardId].elements[index] = {
          ...activeBoards[boardId].elements[index],
          ...updates
        };
        socket.to(boardId).emit('element-updated', { elementId, updates });
      }
    }
  });
  
  socket.on('element-delete', (data) => {
    const { boardId, elementId } = data;
    if (activeBoards[boardId]) {
      activeBoards[boardId].elements = activeBoards[boardId].elements.filter(el => el.id !== elementId);
      socket.to(boardId).emit('element-deleted', elementId);
    }
  });
  
  socket.on('cursor-move', (data) => {
    const { boardId, cursor } = data;
    if (activeBoards[boardId] && activeBoards[boardId].users[socket.id]) {
      activeBoards[boardId].users[socket.id].cursor = cursor;
      socket.to(boardId).emit('cursor-moved', {
        userId: socket.id,
        cursor
      });
    }
  });
  
  socket.on('viewport-change', (data) => {
    const { boardId, viewport } = data;
    if (activeBoards[boardId]) {
      activeBoards[boardId].viewport = viewport;
      socket.to(boardId).emit('viewport-changed', {
        userId: socket.id,
        viewport
      });
    }
  });
  
  socket.on('disconnect', () => {
    for (const boardId in activeBoards) {
      if (activeBoards[boardId].users[socket.id]) {
        delete activeBoards[boardId].users[socket.id];
        io.to(boardId).emit('user-left', socket.id);
        
        if (Object.keys(activeBoards[boardId].users).length === 0) {
          const boards = readBoards();
          boards[boardId] = {
            elements: activeBoards[boardId].elements,
            lastUpdated: new Date().toISOString()
          };
          writeBoards(boards);
          delete activeBoards[boardId];
        }
      }
    }
  });
});

app.post('/api/save-board', (req, res) => {
  try {
    const { boardId, elements } = req.body;
    if (!boardId || !elements) {
      return res.status(400).json({ error: 'Missing boardId or elements' });
    }
    
    const boards = readBoards();
    boards[boardId] = {
      elements,
      lastUpdated: new Date().toISOString()
    };
    
    writeBoards(boards);
    res.json({ success: true, message: 'Board saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save board' });
  }
});

app.get('/api/load-board/:boardId', (req, res) => {
  try {
    const { boardId } = req.params;
    const boards = readBoards();
    
    if (boards[boardId]) {
      res.json({ 
        success: true, 
        elements: boards[boardId].elements,
        lastUpdated: boards[boardId].lastUpdated
      });
    } else {
      res.json({ success: false, message: 'Board not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load board' });
  }
});

app.post('/api/create-board', (req, res) => {
  try {
    const boardId = uuidv4();
    const boards = readBoards();
    
    boards[boardId] = {
      elements: [],
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    writeBoards(boards);
    res.json({ success: true, boardId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create board' });
  }
});

app.get('/api/boards', (req, res) => {
  try {
    const boards = readBoards();
    const boardList = Object.keys(boards).map(id => ({
      id,
      created: boards[id].created,
      lastUpdated: boards[id].lastUpdated,
      elementCount: boards[id].elements?.length || 0
    }));
    
    res.json({ success: true, boards: boardList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get boards list' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO server ready`);
});