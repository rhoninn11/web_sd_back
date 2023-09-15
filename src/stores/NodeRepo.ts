import { DBStore, DBRecord } from "./DBStore";
import { ServerNode } from "../types/01_node_t";
import { v4 as uuid } from 'uuid';


class NodeEditStructure {
    instance: ServerNode = new ServerNode();
    edit_drafts: ServerNode[] = [];
    applied_edits: number = 0;

    public try_aplly_edit(edit: ServerNode) {
        // console.log('try_aplly_edit: ', this.instance, edit);
        if (this.instance.user_id != edit.user_id) return;
        if (edit.user_id != edit.db_node.user_id) return;
        if (this.instance.db_node.id != edit.db_node.id) return;
        if (this.instance.db_node.timestamp > edit.db_node.timestamp) return;

        this.instance = edit;
        this.applied_edits += 1;
    }

    public vissualize() {
        console.log('core: ', this.instance.db_node.id, this.instance.db_node.timestamp);
        console.log("edits: ", this.edit_drafts.map((edit) => edit.db_node.timestamp));
        console.log("applied edits: ", this.applied_edits);
    }
}

export class NodeRepo {

    private static instance: NodeRepo;
    private DBStore: DBStore | undefined = undefined;
    private serv_editable_nodes: NodeEditStructure[] = [];

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

    private _squash_edits() {
        this.serv_editable_nodes.forEach((editable) => {
            let drafts = editable.edit_drafts;
            if (drafts.length > 0) {
                drafts.forEach((draft) => editable.try_aplly_edit(draft));
                editable.edit_drafts = []
            }
        });
    }

    private _apply_edits(edits: ServerNode[]) {
        edits.forEach((edit) => {
            let editable_node = this.serv_editable_nodes.find((ed_node) => ed_node.instance.db_node.id === edit.db_node.id);
            if (editable_node) {
                editable_node.edit_drafts.push(edit);
            }
        });
    }

    private async _fetch_node() {
        let nodes = await this.DBStore?.get_nodes();
        let edits = await this.DBStore?.get_edits();
        if (!nodes || !edits) return;

        this.serv_editable_nodes = nodes.map((node) => this.base_edit_Structure_of_node(node));
        if (edits) {
            this._apply_edits(edits);
            this.serv_editable_nodes.forEach((editable) => editable.vissualize());
            this._squash_edits();
            this.serv_editable_nodes.forEach((editable) => editable.vissualize());
            // this.serv_editable_nodes.forEach((editable) => console.log(editable.instance));
            
        }
    }


    public insert_node(node_data: ServerNode) {
        let new_node_id = this.serv_editable_nodes.length;
        node_data.db_node.id = new_node_id;
        this.serv_editable_nodes.push(this.base_edit_Structure_of_node(node_data));
        this.DBStore?.insert_node(new_node_id.toString(), JSON.stringify(node_data));
        return node_data;
    }

    public get_node(uuid: string) {
        let node = this.serv_editable_nodes.find((es) => es.instance.db_node.id.toString() === uuid)?.instance;
        return node;
    }

    public get_all_nodes() {
        return this.serv_editable_nodes.map((node) => node.instance);
    }

    public edit_node(node_data: ServerNode) {
        let nes = this.serv_editable_nodes.filter((es) => es.instance.db_node.id === node_data.db_node.id);
        nes.forEach((es) => es.edit_drafts.push(node_data));
        
        this.DBStore?.insert_edit(uuid(), JSON.stringify(node_data));
        return node_data;
    }
}