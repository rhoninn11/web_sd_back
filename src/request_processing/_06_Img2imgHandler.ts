import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types/types';
import { SDClient } from '../StableDiffusionConnect';
import { mtdta_JSON_id, serverRequest } from '../types/02_serv_t';
import { TypedRequestHandler, send_object } from './RequestHandler';
import { img2img } from '../types/03_sd_t';
import { ImgRepo } from '../stores/ImgRepo';


export class Img2imgHandler extends TypedRequestHandler<img2img> {
    private sd: SDClient | undefined = undefined;

    constructor() {
        super();
        this.type = 'img2img';
    }

    public bind_sd(sd: SDClient) {
        this.sd = sd;
        return this;
    }

    private fetch_img_for(img_to_img: img2img) {
        let img_id = img_to_img.img2img.bulk.img.id.toString();
        let ref_img = ImgRepo.getInstance().get_img(img_id)

        if (!ref_img)
            return undefined;

        img_to_img.img2img.bulk.img = ref_img.img;

        return img_to_img;
    }

    public handle_request(cl: Client, req: serverRequest) {
        if (!this.sd)
            return;

        let img_data: img2img = this.unpack_data(req.data);

        let mtd_id: mtdta_JSON_id = JSON.parse(img_data.img2img.metadata.id);
        let unique_id = new mtdta_JSON_id(uuidv4(), cl.auth_id, mtd_id.node_id);
        
        img_data.img2img.metadata.id = JSON.stringify(unique_id);

        let img_data_full = this.fetch_img_for(img_data);
        if (!img_data_full){
            console.log('+++ Image not found for img2img request');
            return;
        }

        let lazy_response = (sd_response: any) => {
            // sd response is almost the same as server request just id is missing
            sd_response.id = req.id;
            send_object(cl, sd_response);
        };

        this.sd.send_img2img(img_data_full, lazy_response);
    }
}