import net from "net";
import { WebSocket, WebSocketServer } from "ws";

interface VehicleData {
  battery_temperature: number | string;
  timestamp: number;
}

const TCP_PORT = 12000;
const WS_PORT = 8080;
const tcpServer = net.createServer();
const websocketServer = new WebSocketServer({ port: WS_PORT });

// Add temperature monitoring class
class TemperatureMonitor {
  private breaches: number[] = [];
  private readonly SAFE_MIN = 20;
  private readonly SAFE_MAX = 80;
  private readonly TIME_WINDOW = 5000; // 5 seconds
  private readonly MAX_breaches = 3;

  checkTemperature(temp: number) {
    const now = Date.now();
    
    this.breaches = this.breaches.filter(
      time => now - time < this.TIME_WINDOW
    );

    if (temp < this.SAFE_MIN || temp > this.SAFE_MAX) {
      this.breaches.push(now);
      
      if (this.breaches.length > this.MAX_breaches) {
        console.log(`[${new Date().toISOString()}] Warning: Temperature threshold gone over top multiple times!`);
      }
    }
  }
}

const tempMonitor = new TemperatureMonitor();

// Validate data function
function validateData(data: any): data is VehicleData {
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    if (!parsed || typeof parsed !== 'object') return false;
    if (!('battery_temperature' in parsed) || !('timestamp' in parsed)) return false;
    
    if (typeof parsed.battery_temperature === 'string') {
      parsed.battery_temperature = parseFloat(parsed.battery_temperature);
    }
    
    if (typeof parsed.battery_temperature !== 'number' || isNaN(parsed.battery_temperature)) return false;
    if (typeof parsed.timestamp !== 'number') return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

tcpServer.on("connection", (socket) => {
  console.log("TCP client connected");

  socket.on("data", (msg) => {
    const message: string = msg.toString();
    console.log(`Received: ${message}`);

    if (validateData(message)) {
      const data = JSON.parse(message);
      tempMonitor.checkTemperature(data.battery_temperature);
      
      // Send JSON over WS to frontend clients
      websocketServer.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } else {
      console.log('Invalid data received:', message);
    }
  });

  socket.on("end", () => {
    console.log("Closing connection with the TCP client");
  });

  socket.on("error", (err) => {
    console.log("TCP client error: ", err);
  });
});

websocketServer.on("listening", () =>
  console.log(`Websocket server started on port ${WS_PORT}`)
);

websocketServer.on("connection", async (ws: WebSocket) => {
  console.log("Frontend websocket client connected");
  ws.on("error", console.error);
});

tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP server listening on port ${TCP_PORT}`);
});
