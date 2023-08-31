import { ServerNode } from "../types/types_sd";
import { DBStore, DBRecord } from "./DBStore";

export class EdgeRepo {
    
    private static instance: EdgeRepo;
    private DBStore: DBStore | undefined = undefined;
    private nodes: DBRecord[] = [];

    private constructor() {
    }

    public static getInstance(): EdgeRepo {
        if (!EdgeRepo.instance) {
            EdgeRepo.instance = new EdgeRepo();
        }

        return EdgeRepo.instance;
    }

    public bindDBStore(DBStore: DBStore) {
        this.DBStore = DBStore;
        this._fetch_edges();
    }

    private async _fetch_edges() {
        let images = await this.DBStore?.get_nodes();
        if (images) this.nodes = images;
    }

    insert_edge(uuid: string, node_data: ServerNode) {
        this.DBStore?.insert_node(uuid, JSON.stringify(node_data));
    }
}