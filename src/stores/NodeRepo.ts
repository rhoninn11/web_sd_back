import { DBStore, DBRecord } from "./DBStore";
import { ServerNode } from "../types/01_node_t";

export class NodeRepo {
    
    private static instance: NodeRepo;
    private DBStore: DBStore | undefined = undefined;
    private nodes: DBRecord[] = [];

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
        if (nodes) this.nodes = nodes;
    }

    insert_node(uuid: string, node_data: ServerNode) {
        this.DBStore?.insert_node(uuid, JSON.stringify(node_data));
    }
}