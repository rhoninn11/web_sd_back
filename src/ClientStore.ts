import WebSocket from 'ws';
import { Client } from './types/types';
import { PasswordBank } from './PasswordBank';
import { Syncer } from './Syncer';

export class ClientStore {
    private clients_idx: Client[];
    private static instance: ClientStore;
    private constructor() {
        this.clients_idx = [];
    }

    public static getInstance(): ClientStore {
        if (!ClientStore.instance)
        ClientStore.instance = new ClientStore();

        return ClientStore.instance;
    }

    public add_client(ws: WebSocket) {
        console.log('<+++> New client connected!');
        const new_client = new Client(ws);
        this.clients_idx.push(new_client);
        return new_client;  
    }
    
    public remove_client = (cl: Client) => {
        const index = this.clients_idx.indexOf(cl);
        if (index !== -1) {
            PasswordBank.getInstance().release_password(cl.auth_id)
            Syncer.getInstance().client_leave_sync(cl);
            this.clients_idx.splice(index, 1);
        }
        console.log('<+++> Client disconnected!');
    }
}
