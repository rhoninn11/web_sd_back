import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';


import { Client, serverRequest } from './types/types';
import { PasswordBank } from './PasswordBank';
import { FlowOps, ServerEdge, ServerNode, authData, txt2img } from './types/types_sd';
import { SDClient } from './StableDiffusionConnect';

const wss = new WebSocket.Server({ port: 8765 });

interface progressData{
    progress: number;
    id: string;
}

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

        if(node_data.node_op == FlowOps.CRATE){
            node_data.serv_id = uuidv4();
            node_data.user_id = cl.auth_id.toString();
        }

        req.data = this.pack_data(node_data);
        send_object(cl, req);
    }
}

export class EdgeHandler extends dataWrapper<ServerEdge> implements requestHandler  {

    public handle_request(cl: Client, req: serverRequest) {
        let edge_data = this.unpack_data(req.data);

        if(edge_data.node_op == FlowOps.CRATE){
            edge_data.serv_id = uuidv4();
            edge_data.user_id = cl.auth_id.toString();
        }

        req.data = this.pack_data(edge_data);
        send_object(cl, req);
    }
}





