import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';


import { Client } from './types/types';
import { PasswordBank } from './PasswordBank';
import { txt2img } from './types/types_sd';
import { SDClient } from './StableDiffusionConnect';
import { NodeRepo } from './stores/NodeRepo';
import { EdgeRepo } from './stores/EdgeRepo';

import { ServerNode } from './types/01_node_t';
import { ServerEdge } from './types/04_edge_t';
import { authData, serverRequest } from './types/02_serv_t';
import { FlowOps } from './types/00_flow_t';

const wss = new WebSocket.Server({ port: 8765 });

interface requestHandler {
    handle_request: (cl: Client, req: serverRequest) => void;
}

class dataWrapper<T>{
    unpack_data(paked_data: string) {
        let unpack_data:  T =  JSON.parse(paked_data);
        return unpack_data;
    }

    pack_data(unpack_data: T) {
        let paked_data = JSON.stringify(unpack_data);
        return paked_data;
    }
}

const send_object = (cl: Client, obj: any) => {
	let json_text = JSON.stringify(obj);
	cl.ws?.send(json_text);
}

export class authHandler extends dataWrapper<authData> implements requestHandler  {
    public try_auth_user = (cl: Client, pass: string) => {
        let passwd_idx = PasswordBank.getInstance().check_password(pass);
        cl.auth_id = passwd_idx;
        return passwd_idx > -1;
    }

    public handle_request(cl: Client, req: serverRequest) {
        let auth_data = this.unpack_data(req.data);
        let pwd = auth_data.password;
        auth_data.password = "*".repeat(pwd.length);
        auth_data.auth = this.try_auth_user(cl, pwd);
        auth_data.user_id = cl.auth_id.toString();
        req.data = this.pack_data(auth_data);
        send_object(cl, req);
    }
}

export class txt2imgHandler extends dataWrapper<txt2img> implements requestHandler {
    private sd: SDClient | undefined = undefined;

    public bind_sd(sd: SDClient) {
        this.sd = sd;
    }

    public handle_request(cl: Client, req: serverRequest) {
        let img_data: txt2img = this.unpack_data(req.data);

        img_data.txt2img.metadata.id = uuidv4();
        if(this.sd){
            let lazy_response = (response: any) => {
                let type = response.type;
                console.log(`send ${type} object to client?`)

                send_object(cl, response);
            }

            this.sd.send_txt2img(img_data, lazy_response);
        }
    }
}

export class nodeHandler extends dataWrapper<ServerNode> implements requestHandler  {

    public handle_request(cl: Client, req: serverRequest) {
        let node_data = this.unpack_data(req.data);

        if(node_data.node_op == FlowOps.CREATE)
            node_data = this.create_node_on_server(cl, node_data);

        req.data = this.pack_data(node_data);
        send_object(cl, req);
    }
    
    create_node_on_server(cl: Client, node_data: ServerNode): ServerNode {
        let node_repo = NodeRepo.getInstance();
        let uuid = uuidv4();
        node_data.db_node.serv_id = uuid;
        node_data.user_id = cl.auth_id.toString();
        node_repo.insert_node(uuid, node_data);
        
        return node_data;
    }
}

export class EdgeHandler extends dataWrapper<ServerEdge> implements requestHandler  {
    private create_edge_on_server = (cl: Client, edge_data: ServerEdge) => {
        let edge_repo = EdgeRepo.getInstance();
        let uuid = uuidv4();
        edge_data.db_edge.serv_id = uuid;
        edge_data.user_id = cl.auth_id.toString();
        edge_repo.insert_edge(uuid, edge_data);
        
        return edge_data;
    }

    public handle_request(cl: Client, req: serverRequest) {
        let edge_data = this.unpack_data(req.data);

        if(edge_data.node_op == FlowOps.CREATE)
            edge_data = this.create_edge_on_server(cl, edge_data);

        req.data = this.pack_data(edge_data);
        send_object(cl, req);
    }
}





