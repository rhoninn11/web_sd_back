import net from 'net';

import { connectMsg, disconnectMsg, txt2img } from './types/types_sd';
import { img64 } from './types/03_sd_t';
import { SDComUtils } from './SDComUtils';

import sharp from 'sharp';
import { ImgRepo } from './stores/ImgRepo';


class SegmentationProcessor {
    private is_reciveing: boolean = false;
    private reciveing_buffer: Buffer = Buffer.alloc(0);
    private reciveing_len: number = 0;

    public process(data: Buffer) {
        if (this.is_reciveing) {
            this.reciveing_buffer = Buffer.concat([this.reciveing_buffer, data]);
        }

        if (!this.is_reciveing) {
            this.is_reciveing = true;
            this.reciveing_buffer = Buffer.alloc(0);
            this.reciveing_buffer = Buffer.concat([this.reciveing_buffer, data]);
            this.reciveing_len = data.readUInt32LE(0) + 4;
        }

        if (this.reciveing_buffer.byteLength === this.reciveing_len) {
            this.is_reciveing = false;

            let u_data = SDComUtils.unwrap_data(this.reciveing_buffer)
            let obj = SDComUtils.bytes2json2obj(u_data);
            return obj;
        }

        return undefined
    }
}

export class SDClient {
    private static instance: SDClient;
    private client: net.Socket | undefined = undefined;
    private idIndex: Map<string, (data: any) => void> = new Map<string, (data: any) => void>();
    private seg_proc: SegmentationProcessor = new SegmentationProcessor();

    public static getInstance(): SDClient {
        if (!SDClient.instance) {
            SDClient.instance = new SDClient();
        }
        return SDClient.instance;
    }

    public bind_return_func(id: string, return_func: (data: any) => void) {
        this.idIndex.set(id, return_func);
    }

    public send_txt2img(txt2img: txt2img, return_func: (data: any) => void) {
        console.log('Sending txt2img');
        if (this.client){
            console.log('Sending txt2img ...');

            let command = { 
                type: "txt2img",
                data: JSON.stringify(txt2img)
            }

            this._send(this.client, command);
            this.bind_return_func(txt2img.txt2img.metadata.id, return_func);
        }
    }

    private get_return_func(id: string) {
        if(this.idIndex.has(id)){
            let return_func = this.idIndex.get(id);
            return return_func;
        }

        return undefined;
    }

    private pass_object_back(object: any){
        let imgRepo = ImgRepo.getInstance();

        let type = object.type;
        let has_proper_type = ["txt2img", "progress"].includes(type);
        if (has_proper_type) {
            let encoded = object.data;
            let decoded = JSON.parse(encoded);
            let meta_id =  decoded[type].metadata.id;

            let return_this = (return_obj: any) =>{
                let fn = this.get_return_func(meta_id)
                if(fn) fn(return_obj);
                else console.log(`!!! No return function for id: ${meta_id}`);
            }

            if(type === "txt2img"){
                let t2i_obj: txt2img = decoded;
                let img64: img64 = t2i_obj.txt2img.bulk.img;

                let scimg = imgRepo.insert_image(img64);

                let rgb = Buffer.from(scimg.img64, 'base64');
                sharp(rgb, { raw: { width: scimg.x, height: scimg.y, channels: 3 } })
                    .webp({quality: 100})
                    .toBuffer((err, buffer, info) =>{
                        // buffer to base64 string
                        let base64 = buffer.toString('base64');
                        let prefix = `data:image/webp;base64,`
                        scimg.img64 = prefix + base64;
                        scimg.img64 = base64;
                        scimg.mode = "webp";
                        t2i_obj.txt2img.bulk.img = scimg;

                        object.data = JSON.stringify(t2i_obj);
                        console.log(`buffer length: ${buffer.length}, base64 length: ${base64.length}`)
                        return_this(object)
                    })  
                
            }   
            else return_this(object)

        }
    }

    private _data_processing(data: Buffer) {
        let compleate_object = this.seg_proc.process(data);
        if (compleate_object)
            this.pass_object_back(compleate_object);
    }

    public connect(port: number, host: string) {
        if (this.client != undefined)
            return;

        this.client = net.createConnection({ port: port, host: host }, () => {
            console.log(`Connected to ${host}:${port}`);
            if (this.client) {
                let msg: connectMsg = { connect: 1 };
                this._send(this.client, msg);
            }
        });

        this.client.on('error', (err) => {
            console.error(`Error connecting to ${host}:${port}: ${err.message}`);
        });

        this.client.on('data', (data) => {
            this._data_processing(data);
        });
    }

    private _send(sock: net.Socket, obj: any) {
        let msg_bytes = SDComUtils.obj2json2bytes(obj);
        let wrapped_msg = SDComUtils.wrap_data(msg_bytes);
        sock.write(wrapped_msg);
    }

    public send(obj: any) {
        if (this.client)
            this._send(this.client, obj);
    }

    public close(): void {
        if (this.client) {
            let msg: disconnectMsg = { disconnect: 0 };
            this._send(this.client, msg);
        }
        console.log('Connection closed');
    }
}