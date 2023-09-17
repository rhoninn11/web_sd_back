import WebSocket from 'ws';
import { syncSignature } from './02_serv_t';

export enum syncStage {
	PRE_SYNC = "init",
	INITIAL_SYNC = "bulk_sync",
	INITIAL_SYNC_DONE = "init_sync_done",
	INITIAL_TS_SYNC = "bulk_ts_sync",
	INITIAL_TS_SYNC_DONE = "init_ts_sync_done",
	SYNCED = "synced",
	UPDATE = "update",
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