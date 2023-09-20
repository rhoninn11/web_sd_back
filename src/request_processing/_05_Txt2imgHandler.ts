import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types/types';
import { SDClient } from '../StableDiffusionConnect';
import { mtdta_JSON_id, serverRequest } from '../types/02_serv_t';
import { TypedRequestHandler, send_object } from './RequestHandler';
import { txt2img } from '../types/03_sd_t';


export class Txt2imgHandler extends TypedRequestHandler<txt2img> {
    private sd: SDClient | undefined = undefined;

    constructor() {
        super();
        this.type = 'txt2img';
    }

    public bind_sd(sd: SDClient) {
        this.sd = sd;
        return this;
    }

    public handle_request(cl: Client, req: serverRequest) {
        if (!this.sd)
            return;

        let img_data: txt2img = this.unpack_data(req.data);
        let unique_id = new mtdta_JSON_id(uuidv4(), cl.auth_id);
        img_data.txt2img.metadata.id = JSON.stringify(unique_id);
        console.log('+T2I+ txt2img');
        let lazy_response = (sd_response: any) => {
            // sd response is almost the same as server request just id is missing
            sd_response.id = req.id;
            send_object(cl, sd_response);
        };

        this.sd.send_txt2img(img_data, lazy_response);
    }
}