import pytest
import asyncio
import websockets
import json
from weasel import main, create_response

@pytest.fixture
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def server():
    # Start the server in a separate thread or process
    server = asyncio.run(main())
    yield server
    # Teardown logic if needed

@pytest.mark.asyncio
async def test_heartbeat(server):
    uri = "wss://localhost:8765"
    async with websockets.connect(uri) as websocket:
        heartbeat_msg = json.dumps({"type": "heartbeat", "timestamp": int(time.time() * 1000)})
        await websocket.send(heartbeat_msg)
        response = await websocket.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "heartbeat_ack"
        assert response_data["status"] == "heartbeat received"

@pytest.mark.asyncio
async def test_text_message(server):
    uri = "wss://localhost:8765"
    async with websockets.connect(uri) as websocket:
        text_msg = json.dumps({"type": "text", "content": "Hello, WebSocket!"})
        await websocket.send(text_msg)
        response = await websocket.recv()
        response_data = json.loads(response)
        assert response_data["type"] == "text_ack"
        assert response_data["status"] == "text received"
        assert response_data["content"] == "Hello, WebSocket!"

# Add more tests for other message types...

