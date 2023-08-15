

export interface connectMsg {
    connect: number;
}

export interface disconnectMsg {
    disconnect: number;
}




export interface metadata {
    id: string;
}

export interface txt2img_config {
    prompt: string;
    prompt_negative: string;
    seed: number;
    samples: number;
}

export interface txt2img_content {
    config: txt2img_config
    metadata: metadata;
}

export interface txt2img {
    txt2img: txt2img_content;
}