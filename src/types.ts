import WebSocket from 'ws';

export interface Client {
	ws: WebSocket,
	auth: number
}

export interface serverRequest {
	type: string;
	data: string;
}
