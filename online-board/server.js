const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
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
    console.error('Error reading boards file:', error);
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
    console.error('Error saving board:', error);
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
    console.error('Error loading board:', error);
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
    console.error('Error creating board:', error);
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
    console.error('Error getting boards list:', error);
    res.status(500).json({ error: 'Failed to get boards list' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/save-board - Save board data`);
  console.log(`  GET  /api/load-board/:boardId - Load board data`);
  console.log(`  POST /api/create-board - Create new board`);
  console.log(`  GET  /api/boards - Get list of all boards`);
});