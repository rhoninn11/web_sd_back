import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types/types';
import { SDClient } from '../StableDiffusionConnect';
import { serverRequest } from '../types/02_serv_t';
import { TypedRequestHandler, send_object } from './RequestHandler';
import { img2img } from '../types/03_sd_t';


export class Img2imgHandler extends TypedRequestHandler<img2img> {
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
        let img_data: img2img = this.unpack_data(req.data);

        img_data.img2img.metadata.id = uuidv4();
        if (this.sd) {
            let lazy_response = (sd_response: any) => {
                // sd response is almost the same as server request just id is missing
                sd_response.id = req.id;
                send_object(cl, sd_response);
            };

            // this.sd.send_txt2img(img_data, lazy_response);
        }
    }
}