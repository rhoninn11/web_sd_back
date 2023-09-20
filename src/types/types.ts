import WebSocket from 'ws';
import { syncSignature } from './02_serv_t';

export enum syncStage {
	PRE_SYNC = "pre",
	INITIAL_SYNC = "init_sync",
	INITIAL_SYNC_DONE = "init_sync_done",
	TS_SYNC = "ts_sync",
	SYNCED = "synced",
	RT_SYNC = "rt_sync",
}

export class Client {
	ws: WebSocket | null = null;
	auth_id: number = -1;
	sync_stage: syncStage = syncStage.PRE_SYNC;
	sync_signature:  syncSignature = new syncSignature();

	constructor(ws: WebSocket) {
		this.ws = ws;
	}
}