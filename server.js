const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // Import the CORS middleware
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:5173',  // Allow the React app to connect
    methods: ['GET', 'POST'],
  }
});

app.use(cors({origin: 'http://localhost:5173',}));

/*mongoose.connect('mongodb://localhost:27017/sweetspot')
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));*/

const Establishment = mongoose.model('Establishment', {
  name: String,
  avatar: String,
  description: String,
  price: String,
  spots: String,
  id: String
});

app.get('/api/establishments', async (req, res) => {
  try {
    const establishments = await Establishment.find();
    console.log('fetched est:' + establishments);
    res.json(establishments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

const port = new SerialPort({
  path: 'COM3',    // Replace 'COM3' with the correct port for your system
  baudRate: 9600,  // Match the baud rate with your Arduino code
});

// Create a Readline parser to process incoming data line by line
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle commands from React client
  socket.on('arduino-command', (command) => {
    console.log(`Received command: ${command}`);
    if (port.isOpen) {
      port.write(command + '\n');
    }
  });

// When data is received from the Arduino, send it to the connected clients via WebSocket
parser.on('data', (data) => {
  //console.log(`Data from Arduino: ${data}`);
  io.emit('arduino-data', data);  // Emit data to React clients
});

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve the React app (make sure React is built if you're serving from 'build')
app.use(express.static('build'));

// Start the server
server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
