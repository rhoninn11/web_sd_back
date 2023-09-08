import { FlowOps } from "./00_flow_t";

export interface FlowEdge {
    id: string;

    source: string;
    target: string;

    style: EdgeStyle;
    type: string;
}

export class DBEdge {
    id: number = -1;

    source: string = '';
    target: string = '';
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