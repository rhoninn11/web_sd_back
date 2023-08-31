import WebSocket from 'ws';
import { Client, serverRequest } from './types/types';
import { ClientStore } from './ClientStore';
import { authHandler, txt2imgHandler, nodeHandler, EdgeHandler } from './ReqHandle';
import { SDClient} from './StableDiffusionConnect';
import { DBStore } from './stores/DBStore';
import { ImgRepo } from './stores/ImgRepo';
import { NodeRepo } from './stores/NodeRepo';
import { EdgeRepo } from './stores/EdgeRepo';

const send_object = (cl: Client, obj: any) => {
	let json_text = JSON.stringify(obj);
	cl.ws?.send(json_text);
}

const handle_request = (cl: Client, req: serverRequest, sd: SDClient) => {
	console.log(`Got request: ${req.type}`);
	if (req.type == 'auth') {
		let auth_handler = new authHandler();
		auth_handler.handle_request(cl, req);
	}
	else if (req.type == 'txt2img'){
		let txt2img_handler = new txt2imgHandler();
		txt2img_handler.bind_sd(sd);
		txt2img_handler.handle_request(cl, req);
	}
	else if (req.type == 'serverNode'){
		let handler = new nodeHandler();
		handler.handle_request(cl, req);
	}
	else if (req.type == 'serverEdge'){
		let handler = new EdgeHandler();
		handler.handle_request(cl, req);
	}
}

const handle_message = (cl: Client, message: any, sd: SDClient) => {
	let msg: serverRequest = JSON.parse(message);
	handle_request(cl, msg, sd)
}

const exit_related = (sd: SDClient, db: DBStore) => {
	process.on('SIGINT', (code) => {
		sd.close();
		db.exit();
		// waith a second for the socket to close
		setTimeout(() => {
			process.exit();
		}, 1000);
	});

	process.on('SIGUSR2', (code) => {
		console.log('nodemon SIGUSR2');
		sd.close();
		db.exit();
		// waith a second for the socket to close
		setTimeout(() => {
			process.exit();
		}, 1000);
	});
}

const backend_server = async () => {
	let port = 8700;
	let sd_port = 6500;

	const db = DBStore.getInstance();
	const imgStore = ImgRepo.getInstance();
	const nodeRepo = NodeRepo.getInstance();
	const edgeRepo = EdgeRepo.getInstance();

	await imgStore.bindDBStore(db);
	await nodeRepo.bindDBStore(db);
	await edgeRepo.bindDBStore(db);



	const sd = SDClient.getInstance();
	sd.connect(sd_port, '127.0.0.1');

	const wss = new WebSocket.Server({ port: port });
	wss.on('connection', (ws) => {
		const new_client = ClientStore.getInstance().add_client(ws);
		ws.on('close', () => ClientStore.getInstance().remove_client(new_client));
		ws.on('message', (message: any) => handle_message(new_client, message, sd));
	});

	console.log(`Server started on ws://localhost:${port}`);
	exit_related(sd, db);
}

backend_server();

