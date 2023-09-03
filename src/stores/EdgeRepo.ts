import { DBStore, DBRecord } from "./DBStore";
import { ServerEdge } from "../types/04_edge_t";

export class EdgeRepo {
    
    private static instance: EdgeRepo;
    private DBStore: DBStore | undefined = undefined;
    private edges: DBRecord[] = [];

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
        let edges = await this.DBStore?.get_nodes();
        if (edges) this.edges = edges;
    }

    insert_edge(uuid: string, node_data: ServerEdge) {
        this.DBStore?.insert_edge(uuid, JSON.stringify(node_data));
    }
}