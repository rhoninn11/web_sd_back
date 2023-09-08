import { FlowOps, NodePosition, RenderData } from "./00_flow_t";
import { PromptRealatedData } from "./02_serv_t";
import { promptConfig } from "./03_sd_t";


export class PromptReference {
    prompt: promptConfig = new promptConfig();
    prompt_img_id: number = -1;
}

export interface NodeData {
	id: string;
    initial_node_id: number;
    result_data: PromptReference;
}

interface NodeCallbacks {
    on_update_result_img: () => void;
    on_update_result_prompt: () => void;
}

export interface NodeConnData {
    node_data: NodeData;
    node_callback: NodeCallbacks | null;
}

export interface FlowNode {
    id: string;
    type: string;
    position: NodePosition;
    data: NodeConnData
}

export class DBNode {
    id: number = -1;
    position: NodePosition = { x: 0, y: 0 };

    initial_node_id: number = -1;
    result_data: PromptReference = new PromptReference();
}

export class ServerNode {
    user_id: string = '';
    node_op: FlowOps = FlowOps.NONE;
    db_node: DBNode = new DBNode();
}
