import asyncio
import json
import ssl
import websockets
from rich.console import Console
from rich.json import JSON
from websockets.exceptions import ConnectionClosedError

console = Console()
connected_clients = set()

def decompress_message(data):
    try:
        return data[::-1]
    except Exception as e:
        console.log(f"Decompression failed: {e}")
        return None

async def handle_client(websocket, path):
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            if isinstance(message, bytes):
                message = decompress_message(message.decode("utf-8"))
            console.print(JSON(message))
            await handle_message(websocket, message)
    except ConnectionClosedError as e:
        console.log(f"Connection closed: {websocket} - {e}")
    except Exception as e:
        console.log(f"Unexpected error: {e}")
    finally:
        connected_clients.remove(websocket)

async def handle_message(websocket, message):
    try:
        msg = json.loads(message)
        response = create_response(msg)
        await websocket.send(json.dumps(response))
    except json.JSONDecodeError:
        console.log("Received invalid JSON")
    except Exception as e:
        console.log(f"Error handling message: {e}")

def create_response(msg):
    response = {"type": msg["type"] + "_ack"}
    if msg["type"] == "heartbeat":
        response.update({"timestamp": msg["timestamp"], "status": "heartbeat received"})
    elif msg["type"] == "text":
        response.update({"id": msg.get("id", None), "status": "text received", "content": msg["content"]})
    elif msg["type"] == "metrics":
        response.update({"status": "metrics collected"})
    elif msg["type"] == "binary":
        response.update({"status": "binary data received"})
    elif msg["type"] == "alert":
        response.update({"status": "alert triggered"})
    elif msg["type"] == "analytics":
        response.update({"status": "real-time analytics provided"})
    elif msg["type"] == "priority":
        response.update({"status": "high-priority message processed"})
    elif msg["type"] == "routing":
        response.update({"status": "message routed intelligently"})
    elif msg["type"] == "api":
        response.update({"status": "API abstraction tested"})
    elif msg["type"] == "custom":
        response.update({"status": "custom function executed"})
    elif msg["type"] == "qos":
        response.update({"status": "QoS settings applied"})
    elif msg["type"] == "config":
        response.update({"status": "dynamic configuration updated"})
    elif msg["type"] == "session":
        response.update({"status": "session managed successfully"})
    else:
        response.update({"status": "unknown message type"})
    return response

async def main():
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(
        certfile="/var/lib/local_server/certs/localhost.crt",
        keyfile="/var/lib/local_server/private/localhost.key",
    )
    server = await websockets.serve(handle_client, "localhost", 8765, ssl=ssl_context)
    console.log("WebSocket server started on wss://localhost:8765")
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.log("Server stopped manually")
    except Exception as e:
        console.log(f"Server error: {e}")
