import { DBStore, DBRecord } from "./DBStore";
import { ServerEdge } from "../types/04_edge_t";

export class EdgeRepo {
    
    private static instance: EdgeRepo;
    private DBStore: DBStore | undefined = undefined;
    private serv_edges: ServerEdge[] = [];

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
        let edges = await this.DBStore?.get_edges();
        if (edges) [
            this.serv_edges = edges
        ]
    }

    public insert_edge(uuid: string, node_data: ServerEdge) {
        this.serv_edges.push(node_data);
        this.DBStore?.insert_edge(uuid, JSON.stringify(node_data));
    }

    public get_edge(uuid: string) {
        let edge = this.serv_edges.find((edge) => edge.db_edge.serv_id === uuid);
        return edge;
    }

    public get_all_edges() {
        return this.serv_edges;
    }
}