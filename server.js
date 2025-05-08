const express = require('express');
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

// Enable CORS for all domains (or specify a specific domain, e.g. 'http://localhost:3000')
app.use(cors({origin: 'http://localhost:5173',}));

// Setup Serial Port connection (replace 'COM3' with the correct port)
const port = new SerialPort({
  path: 'COM3',    // Replace 'COM3' with the correct port for your system
  baudRate: 9600,  // Match the baud rate with your Arduino code
});

// Create a Readline parser to process incoming data line by line
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// When data is received from the Arduino, send it to the connected clients via WebSocket
parser.on('data', (data) => {
  console.log(`Data from Arduino: ${data}`);
  io.emit('arduino-data', data);  // Emit data to React clients
});

// Serve the React app (make sure React is built if you're serving from 'build')
app.use(express.static('build'));

// Start the server
server.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});
