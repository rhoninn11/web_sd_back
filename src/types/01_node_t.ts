import { FlowOps, NodePosition, RenderData } from "./00_flow_t";
import { PromptRealatedData } from "./02_serv_t";
import { txt2img_config } from "./03_sd_t";


export interface NodeData {
	db_id: number;
    serv_id: string;
	data_prompt: PromptRealatedData;
    data_render: RenderData;
}

export interface FlowNode {
    id: string;
    type: string;
    position: NodePosition;
    data: NodeData
}

export class DBNode {
    db_id: number = -1;
    id: string = '';
    serv_id: string = '';

    type: string = '';
    position: NodePosition = { x: 0, y: 0 };
    prompt: txt2img_config = new txt2img_config();
    img: string = '';
}

export class ServerNode {
    user_id: string = '';
    node_op: FlowOps = FlowOps.NONE;
    db_node: DBNode = new DBNode();
}
