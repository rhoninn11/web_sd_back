import WebSocket from 'ws';

export class Client {
	ws: WebSocket | null = null;
	auth_id: number = -1;

	constructor(ws: WebSocket) {
		this.ws = ws;
	}
}

export interface serverRequest {
	type: string;
	data: string;
}
