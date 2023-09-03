import { FlowOps } from "./00_flow_t";

export class DBEdge {
    db_id: number = -1;
    id: string = '';
    serv_id: string = '';

    source: string = '';
    target: string = '';
}


export interface FlowEdge {
    id: string;
    
    db_id: number;
    serv_id: string;
    source: string;
    target: string;

    style: EdgeStyle;
}

enum EDGE_COLOR {
    COLOR_1 = '#FF0072',
    COLOR_2 = '#FBB195',
    COLOR_3 = '#F67280',
    COLOR_4 = '#C06C84',
    COLOR_5 = '#6C5B7B',
    COLOR_6 = '#355C7D',
}

export class EdgeStyle {
    strokeWidth: number = 2;
    stroke: string = EDGE_COLOR.COLOR_2;
}

export class ServerEdge {
    user_id: string = '';
    node_op: FlowOps = FlowOps.NONE;
    db_edge: DBEdge = new DBEdge();
}