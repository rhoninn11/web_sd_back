import { syncSignature } from './types/02_serv_t';
import { Client } from './types/types';


class rt_syncSignature {
    nodes_ids: Record<number, number> = {};
    edges_ids: Record<number, number> = {};
    imgs_ids: Record<number, number> = {};

    private _add_id(id: number, ids: Record<number, number>) {
        if (id in ids) {
            ids[id] += 1;
        } else {
            ids[id] = 1;
        }
    }

    public add_node(id: number) {
        this._add_id(id, this.nodes_ids);
    }

    public add_edge(id: number) {
        this._add_id(id, this.edges_ids);
    }

    public add_img(id: number) {
        this._add_id(id, this.imgs_ids);
    }

    public asSyncSignature() {
        let sig = new syncSignature();
        sig.node_id_arr = Object.keys(this.nodes_ids);
        sig.edge_id_arr = Object.keys(this.edges_ids);
        sig.img_id_arr = Object.keys(this.imgs_ids);
        return sig;
    }

    public clear() {
        this.nodes_ids = {};
        this.edges_ids = {};
        this.imgs_ids = {};
    }
}

class rt_sync_helper {
    user_focused_id: number = 0;
    serv_focused_id: number = 0;
    sync_slots: rt_syncSignature = new rt_syncSignature();

    public user_slot() {
        return this.sync_slots;
    }

    public serv_slot() {
        return this.sync_slots;
    }
}

interface client_rt_sync_st {
    client: Client;
    sync_helper: rt_sync_helper;
}

export class Syncer {
    private sync_redy_clients = new Map<number, client_rt_sync_st>();
    private static instance: Syncer;

    public static getInstance(): Syncer {
        if (!Syncer.instance)
            Syncer.instance = new Syncer();

        return Syncer.instance;
    }

    public client_ready_to_sync = (cl: Client) => {
        const id = cl.auth_id
        if (!this.sync_redy_clients.has(id)) {
            let fresh: client_rt_sync_st = { client: cl, sync_helper: new rt_sync_helper() }
            this.sync_redy_clients.set(id, fresh);
        }
    }

    public client_leave_sync = (cl: Client) => {
        const id = cl.auth_id;
        if (this.sync_redy_clients.has(id)) {
            this.sync_redy_clients.delete(id);
        }
    }

    
    public node_to_sync = (id: number, owner_id: number) => {
        this.sync_redy_clients.forEach((snc_st) => {
            if (snc_st.client.auth_id != owner_id) {
                snc_st.sync_helper.user_slot().add_node(id);
            }
        });
    }
    
    public edge_to_sync = (id: number, owner_id: number) => {
        this.sync_redy_clients.forEach((snc_st) => { 
            if (snc_st.client.auth_id != owner_id) {
                snc_st.sync_helper.user_slot().add_edge(id);
            }
        });
    }

    public img_to_sync = (id: number, owner_id: number) => {
        this.sync_redy_clients.forEach((snc_st) => { 
            if (snc_st.client.auth_id != owner_id) {
                snc_st.sync_helper.serv_slot().add_img(id);
            }
        });
    }

    public get_sync_data_for_client = (cl: Client): syncSignature => {
        const id = cl.auth_id;
        let client_st = this.sync_redy_clients.get(id);
        if (client_st){
            let u_slot = client_st.sync_helper.user_slot()
            let sync_S = u_slot.asSyncSignature();
            u_slot.clear();
            return sync_S;
        }
        
        return new syncSignature();
    }


}
