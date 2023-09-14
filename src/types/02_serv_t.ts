import { cloneDeep, set } from "lodash";
import { DBImg, metadata, promptConfig } from "./03_sd_t";
import { DBNode, FlowNode } from "./01_node_t";
import { DBEdge, FlowEdge } from "./04_edge_t";

export class PromptRealatedData {
	public propmt_cfg: promptConfig = new promptConfig();
	public img_coded: string = '';

    constructor(){
    }

    public clone(other: PromptRealatedData, copy_img: boolean = false){
        this.propmt_cfg = cloneDeep(other.propmt_cfg);
        if(copy_img)
            this.img_coded = other.img_coded;
        return this;
    }
}


export interface serverRequest {
    id: string;
	type: string;
	data: string;
}

export class authData {
	password: string = '';
	auth: boolean = false;
    user_id: number = -1;
}

export interface progress {
    progress: progress_content;
}//progress request

export interface progress_content {
    metadata: metadata;
    value: number;
}
export enum syncOps {
    NONE = 'none',
    INFO = 'info',
    ACCCEPT = 'accept',
    TRANSFER = 'transfer',
    FINISH = 'finish',
}

export class syncSignature {
    sync_op: syncOps = syncOps.NONE;
    node_id_arr: string[] = [];
    edge_id_arr: string[] = [];
    img_id_arr: string[] = [];
    node_data_arr: DBNode[] = [];
    edge_data_arr: DBEdge[] = [];
    img_data_arr: DBImg[] = [];

    set_ids(nodes: string[], edges: string[], imgs: string[]){
        this.node_id_arr = nodes;
        this.edge_id_arr = edges;
        this.img_id_arr = imgs;
        return this;
    }

    fill_ids(nodes: DBNode[], edges: DBEdge[], imgs: DBImg[]){
        let node_id_arr = nodes.map((node) => node.id.toString())
		let edge_id_arr = edges.map((edge) => edge.id.toString())
		let img_id_arr = imgs.map((img) => img.id.toString())
        this.set_ids(node_id_arr, edge_id_arr, img_id_arr);
    }

    fill_data(nodes: DBNode[], edges: DBEdge[], imgs: DBImg[] ){
        this.fill_ids(nodes, edges, imgs);
        this.node_data_arr = nodes;
        this.edge_data_arr = edges;
        this.img_data_arr = imgs;
    }
}
