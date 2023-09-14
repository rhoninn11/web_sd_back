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
    user_id: number = -1;
    source: string = '';
    target: string = '';
    timestamp: number = Date.now();
}

const EDGE_COLOR_ARR = [
    '#ff8080','#ffbf80','#ffff80','#bfff80',
    '#80ff80','#80ffbf','#80ffff','#80bfff',
    '#8080ff','#bf80ff','#ff80ff','#ff80bf',
    '#ff4d4d','#ffa64d','#ffff4d','#a6ff4d',
    '#4dff4d','#4dffa6','#4dffff','#4da6ff',
    '#4d4dff','#a64dff','#ff4dff','#ff4da6',    
];
// za ciemne: 0, 4
const DEFAULT_EDGE_COLOR = EDGE_COLOR_ARR[22];

export class EdgeStyle {
    strokeWidth: number = 10;
    stroke: string = DEFAULT_EDGE_COLOR;

    set_color(id: number){
        console.log('!!!set_color', id);
        if(id >= 0 && id < EDGE_COLOR_ARR.length){
            console.log('!!! id', id);
            this.stroke = EDGE_COLOR_ARR[id];
        }
        else{
            this.stroke = DEFAULT_EDGE_COLOR;
            console.log('!!! default');
        }
    }
}

export class ServerEdge {
    user_id: number = -1;
    node_op: FlowOps = FlowOps.NONE;
    db_edge: DBEdge = new DBEdge();
}