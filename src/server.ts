import WebSocket from 'ws';
import { Client } from './types/types';
import { ClientStore } from './ClientStore';

import { SDClient} from './StableDiffusionConnect';
import { DBStore } from './stores/DBStore';

import { ImgRepo } from './stores/ImgRepo';
import { NodeRepo } from './stores/NodeRepo';
import { EdgeRepo } from './stores/EdgeRepo';

import { serverRequest } from './types/02_serv_t';
import { handRepositoryInit } from './request_processing/_00_init';
import { HandlerRepository } from './request_processing/HandlerRepository';
import _, { clone } from 'lodash';

import express from 'express';
import path from 'path';


const handle_message = (cl: Client, message: any, sd: SDClient) => {
	let msg: serverRequest = JSON.parse(message);
	console.log('+SERV+ received message', msg.type);
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

// const express_related = (port: number) => {
// 	const app = express();
    
//     // Serve static files from a "public" folder
//     app.use(express.static('public'));

//     // Serve index.html when someone accesses the root URL
//     app.get('/', (req, res) => {
//         res.sendFile(path.join(__dirname, 'public/index.html'));
//     });

//     // Attach WebSocket server to the same HTTP server
//     const server = app.listen(port, () => {
//         console.log(`Server started on http://localhost:${port}`);
//     });
// 	return server
// }

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

	// const server = express_related(port)
	// const wss = new WebSocket.Server({ server });
	
	const wss = new WebSocket.Server({ port: port });
	wss.on('connection', (ws) => {
		const new_client = ClientStore.getInstance().add_client(ws);
		ws.on('close', () => ClientStore.getInstance().remove_client(new_client));
		ws.on('message', (message: any) => handle_message(new_client, message, sd));
	});

	console.log(`Server started on ws://localhost:${port}`);
	exit_related(sd, db);
}


const test_fields = () => {
	
	let que: number = 1;
	let wer: number = 2;
	let ert: number = 3;

	let sample = {
		qwe: que,
		wer: wer,
		ert: ert
	}

	let a = ["qwe", "wer", "ert"]
	a.forEach((key) => {
		let elo: number = (sample as any)[key]
		console.log(key, elo);
	})
}

backend_server();
// test_fields();