import { cloneDeep } from "lodash";
import { metadata, txt2img_config } from "./03_sd_t";

export class PromptRealatedData {
	public propmt_cfg: txt2img_config = new txt2img_config();
	public img_coded: string = '';

    constructor(){
    }

    public clone(other: PromptRealatedData, copy_img: boolean = false){
        this.propmt_cfg = cloneDeep(other.propmt_cfg);
        if(copy_img)
            this.img_coded = other.img_coded;
        return this;
    }
}


export interface serverRequest {
	type: string;
	data: string;
}

export interface authData {
	password: string;
	auth: boolean;
    user_id: string;
}

export interface progress {
    progress: progress_content;
}//progress request

export interface progress_content {
    metadata: metadata;
    value: number;
}


