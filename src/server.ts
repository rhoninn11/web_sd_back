import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 8765 });


interface Client {
	ws: WebSocket,
	info: string
}
const clients: Client[] = [];

const add_client = (ws: WebSocket) => {
	console.log('New client connected!');
	const new_client = { ws, info: 'basic_info' };
	clients.push(new_client);
	return new_client;
}

const remove_client = (ws: WebSocket) => {
	const index = clients.findIndex((client) => client.ws === ws);
	if (index !== -1) {
		clients.splice(index, 1);
	}
	console.log('Client disconnected!');
}

const handle_message = (cl: Client, message: string) => {
	console.log('Message received: ' + message);
	cl.info = message;
	cl.ws.send(cl.info);
}

wss.on('connection', (ws) => {
	const new_client = add_client(ws);
	ws.on('close', () => remove_client(ws));
	ws.on('message', (message: string) => handle_message(new_client, message));
});

// start server

console.log('Server started on ws://localhost:8765');
