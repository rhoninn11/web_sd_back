import { txt2img_content } from "./03_sd_t";


export interface connectMsg {
    connect: number;
}

export interface disconnectMsg {
    disconnect: number;
}

export class txt2img {
    txt2img: txt2img_content = new txt2img_content();
}//txt2img request
