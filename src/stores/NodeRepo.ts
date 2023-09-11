import { DBStore, DBRecord } from "./DBStore";
import { ServerNode } from "../types/01_node_t";

class NodeEditStructure {
    instance: ServerNode = new ServerNode();
    edit_drafts: ServerNode[] = [];
}

export class NodeRepo {
    
    private static instance: NodeRepo;
    private DBStore: DBStore | undefined = undefined;
    private serv_nodes_edit: NodeEditStructure[] = [];

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

    private base_edit_Structure_of_node(node: ServerNode) {
        let edit_structure = new NodeEditStructure();
        edit_structure.instance = node;
        return edit_structure;
    }

    private async _fetch_node() {
        let nodes = await this.DBStore?.get_nodes();
        if (nodes) {
            this.serv_nodes_edit = nodes.map((node) => this.base_edit_Structure_of_node(node));
        }
    }

    public insert_node(node_data: ServerNode) {
        let new_node_id = this.serv_nodes_edit.length;
        node_data.db_node.id = new_node_id;
        this.serv_nodes_edit.push(this.base_edit_Structure_of_node(node_data));
        this.DBStore?.insert_node(new_node_id.toString(), JSON.stringify(node_data));
        return node_data;
    }

    public get_node(uuid: string) {
        let node = this.serv_nodes_edit.find((es) => es.instance.db_node.id.toString() === uuid)?.instance;
        return node;
    }

    public get_all_nodes() {
        return this.serv_nodes_edit.map((node) => node.instance);
    }

    public edit_node(node_data: ServerNode) {
        return node_data;
    }
}