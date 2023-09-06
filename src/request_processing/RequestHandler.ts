import WebSocket from 'ws';


import { Client } from '../types/types';

import { ServerNode } from '../types/01_node_t';
import { serverRequest } from '../types/02_serv_t';
import { type } from 'os';

const wss = new WebSocket.Server({ port: 8765 });

export interface reqeustType{
    type: string;
    match_type: (type: string) => boolean;
}

export class requestHandler implements reqeustType{
    handle_request (cl: Client, req: serverRequest) {
        return;
    };

    public type: string = "";

    public match_type(type: string) {
        return this.type == type;
    }
    // create_request: (cl: Client, req: serverRequest) => void;
}


export class TypedRequestHandler<T> extends requestHandler{
    unpack_data(paked_data: string) {
        let unpack_data:  T =  JSON.parse(paked_data);
        return unpack_data;
    }

    pack_data(unpack_data: T) {
        let paked_data = JSON.stringify(unpack_data);
        return paked_data;
    }
}

export const send_object = (cl: Client, obj: any) => {
	let json_text = JSON.stringify(obj);
	cl.ws?.send(json_text);
}




