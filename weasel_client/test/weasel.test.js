"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = __importDefault(require("ws"));
const config_1 = require("../config");
const weasel_1 = __importDefault(require("../../weasel"));
describe('WebSocket Client', () => {
    let server;
    let wsClient;
    beforeAll((done) => {
        server = new ws_1.default.Server({ port: 8765 });
        server.on('connection', (socket) => {
            socket.on('message', (message) => {
                const msg = JSON.parse(message);
                if (msg.type === 'heartbeat') {
                    socket.send(JSON.stringify({ type: 'heartbeat_ack', status: 'heartbeat received', timestamp: msg.timestamp }));
                }
                else if (msg.type === 'text') {
                    socket.send(JSON.stringify({ type: 'text_ack', status: 'text received', content: msg.content }));
                }
                // Handle other message types...
            });
        });
        done();
    });
    afterAll((done) => {
        server.close();
        done();
    });
    beforeEach(() => {
        wsClient = new weasel_1.default('ws://localhost:8765', config_1.WebSocketConfig);
    });
    test('should establish connection and handle heartbeat', (done) => {
        wsClient.ws.onopen = () => {
            wsClient.send({ type: 'heartbeat', timestamp: Date.now() });
        };
        wsClient.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            expect(message.type).toBe('heartbeat_ack');
            expect(message.status).toBe('heartbeat received');
            done();
        };
    });
    test('should handle text message', (done) => {
        wsClient.ws.onopen = () => {
            wsClient.send({ type: 'text', content: 'Hello, WebSocket!' });
        };
        wsClient.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            expect(message.type).toBe('text_ack');
            expect(message.status).toBe('text received');
            expect(message.content).toBe('Hello, WebSocket!');
            done();
        };
    });
    // Add more tests for other message types...
});
