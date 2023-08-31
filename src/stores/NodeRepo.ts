import { ServerNode } from "../types/types_sd";
import { DBStore, DBRecord } from "./DBStore";

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
        let images = await this.DBStore?.get_nodes();
        if (images) this.nodes = images;
    }

    insert_node(uuid: string, node_data: ServerNode) {
        this.DBStore?.insert_node(uuid, JSON.stringify(node_data));
    }
}