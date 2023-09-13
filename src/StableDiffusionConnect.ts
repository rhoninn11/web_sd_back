import net from 'net';

import { connectMsg, disconnectMsg } from './types/types_sd';
import { img2img, img64 } from './types/03_sd_t';
import { SDComUtils } from './SDComUtils';

import { ImgRepo } from './stores/ImgRepo';
import { processRGB2webPng_base64 } from './image_proc';
import { txt2img } from './types/03_sd_t';


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
        if (!this.client)
            return;

        console.log('Sending txt2img');

        let command = {
            type: "txt2img",
            data: JSON.stringify(txt2img)
        }

        this.bind_return_func(txt2img.txt2img.metadata.id, return_func);
        this._send(this.client, command);
    }

    public send_img2img(img2img: img2img, return_func: (data: any) => void) {
        if (!this.client)
            return;

        console.log('Sending txt2img');
        let command = {
            type: "img2img",
            data: JSON.stringify(img2img)
        }

        this.bind_return_func(img2img.img2img.metadata.id, return_func);
        this._send(this.client, command);
    }

    private try_execute_return_func(id: string, data: any) {
        let return_func = this.idIndex.get(id);
        if (return_func)
            return_func(data);
    }

    process_img_result(object_in: any, decoded_data: any, on_finish: (object_out: any) => void) {

        let img64: img64 = decoded_data[object_in.type].bulk.img;
        let rgb_img = ImgRepo.getInstance().insert_image(img64);

        processRGB2webPng_base64(rgb_img).then((png_img) => {
            decoded_data[object_in.type].bulk.img = png_img;
            object_in.data = JSON.stringify(decoded_data);
            on_finish(object_in)
        })

    }

    private pass_object_back(object: any) {
        let type = object.type;
        let valid_types = ["txt2img", "img2img", "progress"];
        if (!valid_types.includes(type))
            return;

        let encoded = object.data;
        let decoded = JSON.parse(encoded);
        // meaby adopt serverRequest to id available before decode stage
        let meta_id = decoded[type].metadata.id;

        let on_finish = (object_out: any) => {
            this.try_execute_return_func(meta_id, object_out)
        }

        let img_types = ["img2img", "txt2img"];
        if (img_types.includes(type)) {
            this.process_img_result(object, decoded, on_finish)
        } else {
            on_finish(object)
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