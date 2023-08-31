

export interface connectMsg {
    connect: number;
}

export interface disconnectMsg {
    disconnect: number;
}

export interface authData {
	password: string;
	auth: boolean;
}//autg request

export class img64{
    img64: string = '';
    mode: string = '';
    x: number = 0;
    y: number = 0;
}

export class bulk_data{
    img: img64 = new img64();
}

export class metadata {
    id: string = '';
}

export class txt2img_config {
    prompt: string = '';
    prompt_negative: string = '';
    seed: number = 0;
    samples: number = 1;
    power: number = 1

}

export class txt2img_content {
    config: txt2img_config = new txt2img_config();
    metadata: metadata = new metadata();
    bulk: bulk_data = new bulk_data();

}

export class txt2img {
    txt2img: txt2img_content = new txt2img_content();
}//txt2img request

export interface progress {
    progress: progress_content;
}//progress request

export interface progress_content {
    metadata: metadata;
    value: number;
}

//auth
export interface authData {
	password: string;
	auth: boolean;
    user_id: string;
}



export enum FlowOps {
    NONE = 'none',
    CRATE = 'create',
}

export interface NodePosition {
    x: number;
    y: number;
}

export class ServerNode {
    serv_id: string = '';
    user_id: string = '';
    node_op: FlowOps = FlowOps.NONE;
    pos: NodePosition = {x: 0, y: 0};
    deleted: boolean = false;
}


export class ServerEdge {
    serv_id: string = '';
    user_id: string = '';
    node_op: FlowOps = FlowOps.NONE;
}