import WebSocket from 'ws';
import { Client, serverRequest } from './types';
import { ClientStore } from './ClientStore';
import { authHandler } from './ReqHandle';

const wss = new WebSocket.Server({ port: 8765 });

const send_object = (cl: Client, obj: any) => {
	let json_text = JSON.stringify(obj);
	cl.ws.send(json_text);
}


const handle_request = (cl: Client, req: serverRequest) => {
	if (req.type == 'auth'){
        let auth_handler = new authHandler();
        auth_handler.handle_request(cl, req);
    }
	else if (req.type == 'imgGen')
		console.log('imgGen handle not implemented yet!');
}



const handle_message = (cl: Client, message: any) => {
	let msg: serverRequest = JSON.parse(message);
	handle_request(cl, msg)
}

wss.on('connection', (ws) => {
	const new_client = ClientStore.getInstance().add_client(ws);
	ws.on('close', () => ClientStore.getInstance().remove_client(new_client));
	ws.on('message', (message: any) => handle_message(new_client, message));
});

// start server

console.log('Server started on ws://localhost:8765');
console.log('Server started on ws://localhost:8765');
