import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types/types';
import { txt2img } from '../types/types_sd';
import { SDClient } from '../StableDiffusionConnect';
import { serverRequest } from '../types/02_serv_t';
import { TypedRequestHandler, send_object } from './RequestHandler';


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
        let img_data: txt2img = this.unpack_data(req.data);

        img_data.txt2img.metadata.id = uuidv4();
        if (this.sd) {
            let lazy_response = (response: any) => {
                let type = response.type;
                console.log(`send ${type} object to client?`);

                send_object(cl, response);
            };

            this.sd.send_txt2img(img_data, lazy_response);
        }
    }
}
