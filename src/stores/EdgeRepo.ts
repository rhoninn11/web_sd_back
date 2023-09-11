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

    public insert_edge(edge_data: ServerEdge) {
        let new_edge_id = this.serv_edges.length;
        edge_data.db_edge.id = new_edge_id;
        this.serv_edges.push(edge_data);
        this.DBStore?.insert_edge(new_edge_id.toString(), JSON.stringify(edge_data));
        return edge_data;
    }


    public get_edge(uuid: string) {
        let edge = this.serv_edges.find((edge) => edge.db_edge.id.toString() === uuid);
        return edge;
    }

    public get_all_edges() {
        return this.serv_edges;
    }
}