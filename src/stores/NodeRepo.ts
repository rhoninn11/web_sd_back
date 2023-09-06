import { DBStore, DBRecord } from "./DBStore";
import { ServerNode } from "../types/01_node_t";

export class NodeRepo {
    
    private static instance: NodeRepo;
    private DBStore: DBStore | undefined = undefined;
    private serv_nodes: ServerNode[] = [];

    private constructor() {
    }

    public static getInstance(): NodeRepo {
        if (!NodeRepo.instance) {
            NodeRepo.instance = new NodeRepo();
        }

        return NodeRepo.instance;
    }

    public async bindDBStore(DBStore: DBStore) {
        this.DBStore = DBStore;
        await this._fetch_node();
    }

    private async _fetch_node() {
        let nodes = await this.DBStore?.get_nodes();
        if (nodes) {
            this.serv_nodes = nodes;
        }
    }

    public insert_node(uuid: string, node_data: ServerNode) {
        this.serv_nodes.push(node_data);
        this.DBStore?.insert_node(uuid, JSON.stringify(node_data));
    }

    public get_node(uuid: string) {
        let node = this.serv_nodes.find((node) => node.db_node.serv_id === uuid);
        return node;
    }

    public get_all_nodes() {
        return this.serv_nodes;
    }
}