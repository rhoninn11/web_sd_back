import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';


import { Client, serverRequest } from './types';
import { PasswordBank } from './PasswordBank';
import { txt2img } from './types_sd';
import { SDClient } from './StableDiffusionConnect';

const wss = new WebSocket.Server({ port: 8765 });

interface authData {
	password: string;
	auth: boolean;
}

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
	cl.ws.send(json_text);
}

export class authHandler extends dataWrapper<authData> implements requestHandler  {
    public check_password = (cl: Client, pass: string) => {
        return PasswordBank.getInstance().check_password(cl, pass);
    }

    public handle_request(cl: Client, req: serverRequest) {
        let auth_data = this.unpack_data(req.data);
        let pwd = auth_data.password;
        auth_data.password = "*".repeat(pwd.length);
        auth_data.auth = this.check_password(cl, pwd);
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
            let lazy_response = (data: any) => {

                console.log(`elo: ${data}`);
                // req.data = this.pack_data(img_data);
                // send_object(cl, req);
            }

            this.sd.send_txt2img(img_data, lazy_response);
        }
    }
}





