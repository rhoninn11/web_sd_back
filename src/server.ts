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
import https from 'https';
import http from 'http';
import path from 'path';
import fs from "fs"

const handle_message = (cl: Client, message: any, sd: SDClient) => {
	let msg: serverRequest = JSON.parse(message);
	// console.log('+SERV+ received message', msg.type);
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

const is_dev = () => {
	const args = process.argv.slice(2);
	const isDev = args.includes("dev");
	return isDev;
}

const spawn_server = (app: any) => {
	if (is_dev())
		return http.createServer(app);

	const privateKey = fs.readFileSync('tmp/private-key.pem', 'utf8');
	const certificate = fs.readFileSync('tmp/certificate.pem', 'utf8');
	const credentials = { key: privateKey, cert: certificate };

	return https.createServer(credentials, app);
}

const express_related = (port: number) => {
	const app = express();
    app.use(express.static('public'));
    app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')) );

	const start_info = `+++ server started on ${is_dev()? "http": "https"}://localhost:${port}`
	
	const server = spawn_server(app);
    server.listen(port, () => console.log(start_info));
	return server
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

	const server = express_related(port)
	const wss = new WebSocket.Server({ server });
	wss.on('connection', (ws) => {
		const new_client = ClientStore.getInstance().add_client(ws);
		ws.on('close', () => ClientStore.getInstance().remove_client(new_client));
		ws.on('message', (message: any) => handle_message(new_client, message, sd));
	});

	console.log(`+++ server started on ${is_dev()? "ws": "wss"}://localhost:${port}`);
	exit_related(sd, db);
}

backend_server();
