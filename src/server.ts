import WebSocket from 'ws';
import { Client } from './types/types';
import { ClientStore } from './ClientStore';
import { AuthHandler } from './request_processing/AuthHandler';
import { Txt2imgHandler } from './request_processing/Txt2imgHandler';
import { NodeHandler } from './request_processing/NodeHandler';
import { EdgeHandler } from './request_processing/EdgeHandler';
import { SDClient} from './StableDiffusionConnect';
import { DBStore } from './stores/DBStore';

import { ImgRepo } from './stores/ImgRepo';
import { NodeRepo } from './stores/NodeRepo';
import { EdgeRepo } from './stores/EdgeRepo';

import { serverRequest } from './types/02_serv_t';
import { handRepositoryInit } from './request_processing/init';
import { HandlerRepository } from './request_processing/HandlerRepository';
import _, { clone } from 'lodash';

const handle_request = (cl: Client, req: serverRequest, sd: SDClient) => {
	if (req.type == 'auth') {
		let auth_handler = new AuthHandler();
		console.log('auth request', req);
		auth_handler.handle_request(cl, req);
	}
	else if (req.type == 'txt2img'){
		let txt2img_handler = new Txt2imgHandler();
		txt2img_handler.bind_sd(sd);
		txt2img_handler.handle_request(cl, req);
	}
	else if (req.type == 'serverNode'){
		let handler = new NodeHandler();
		handler.handle_request(cl, req);
	}
	else if (req.type == 'serverEdge'){
		let handler = new EdgeHandler();
		handler.handle_request(cl, req);
	}
}

const handle_message = (cl: Client, message: any, sd: SDClient) => {
	let msg: serverRequest = JSON.parse(message);
	console.log('+++ received message', msg.type);
	HandlerRepository.getInstance()?.get_handler(msg.type)?.handle_request(cl, msg);
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
	handRepositoryInit(sd)

	const wss = new WebSocket.Server({ port: port });
	wss.on('connection', (ws) => {
		const new_client = ClientStore.getInstance().add_client(ws);
		ws.on('close', () => ClientStore.getInstance().remove_client(new_client));
		ws.on('message', (message: any) => handle_message(new_client, message, sd));
	});

	console.log(`Server started on ws://localhost:${port}`);
	exit_related(sd, db);
}


const test_lodash = () => {
	let a = ['qrwr',"qweqrw", "asdfg", "giuo", "aso"]
	let b = ["qrwr","qweqrw", "asdfg", "cbjh"]

	let d1 = _.difference(a, b)
	let d2 = _.difference(b, a)

	console.log("+++ differencea a b")
	console.log(d1)
	console.log("+++ differencea b a")
	console.log(d2)
}

backend_server();
// test_lodash();


