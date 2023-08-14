import WebSocket from 'ws';
import { Client, serverRequest } from './types';
import { ClientStore } from './ClientStore';
import { authHandler } from './ReqHandle';
import { SDClient } from './StableDiffusionConnect';

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


const backend_server = () => {
	let port = 8700;
	const wss = new WebSocket.Server({ port: port });
	wss.on('connection', (ws) => {
		const new_client = ClientStore.getInstance().add_client(ws);
		ws.on('close', () => ClientStore.getInstance().remove_client(new_client));
		ws.on('message', (message: any) => handle_message(new_client, message));
	});

	console.log(`Server started on ws://localhost:${port}`);
}

const sd_test = () => {
	let sd_port = 6500;
	let sd = SDClient.getInstance();
	let simple_data = {
		"seed": 123,
		"elo": 123,
	}
	console.log(simple_data);
	let simple_data_bytes = sd.obj2json2bytes(simple_data);
	console.log(simple_data_bytes);
	let wrapped_data = sd.wrap_data(simple_data_bytes);
	console.log(wrapped_data);
	let unwrapped_data = sd.unwrap_data(wrapped_data);
	console.log(unwrapped_data);
	let unpacked_data = sd.bytes2json2obj(unwrapped_data);
	console.log(unpacked_data);

	sd.connect(sd_port, '127.0.0.1');

	process.on('SIGINT', (code) => {
		sd.close();
		// waith 10 seconds for the socket to close
		setTimeout(() => {
			process.exit();
		}, 1000);	
	  });
	  
	process.on('SIGUSR2', (code) => {
		console.log('nodemon SIGUSR2');
		sd.close();
		// waith 10 seconds for the socket to close
		setTimeout(() => {
			process.exit();
		}, 1000);	
	  });
}

// backend_server();
sd_test();

