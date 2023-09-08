
export class img64{
    id: number = -1;
    img64: string = '';
    mode: string = '';
    x: number = 0;
    y: number = 0;
}

export class bulk_data{
    img: img64  = new img64();
}

export class metadata {
    id: string = '';
}

export class promptConfig {
    prompt: string = '';
    prompt_negative: string = '';
    seed: number = 0;
    samples: number = 1;
}

export class txt2img_content {
    config: promptConfig = new promptConfig();
    metadata: metadata = new metadata();
    bulk: bulk_data = new bulk_data();
}

export class txt2img {
    txt2img: txt2img_content = new txt2img_content();
}

export class DBImg {
    id: number = -1;
    img: img64 = new img64();

    from(img: img64){
        this.img = img;
        this.id = img.id;

        return this;
    }
}
