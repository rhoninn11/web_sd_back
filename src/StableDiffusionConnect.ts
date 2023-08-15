import net from 'net';
import { v4 as uuidv4 } from 'uuid';

import { connectMsg, disconnectMsg, txt2img } from './types_sd';
import { ComUtils } from './ComUtils';

export const test_send_txt2img = (sd: SDClient) => {
    let sub_command: txt2img = {
        txt2img: {
            config: {
                prompt: "Sunny day over the sea, pastel painting",
                prompt_negative: "boring skyscape",
                seed: 0,
                samples: 1,
            },
            metadata: { id: uuidv4() }
        }
    }

    let command = { 
        type: "txt2img",
        data: JSON.stringify(sub_command)
    }

    setTimeout(() => {
        console.log('Sending command');
        sd.send(command);
    }, 1000);
}


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

            let u_data = ComUtils.unwrap_data(this.reciveing_buffer)
            let obj = ComUtils.bytes2json2obj(u_data);
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

    private redistribute_object(object: any){
        let keys = Object.keys(object);
        if (keys.includes('type') ) {
            let type = object.type;
            let has_proper_type = ["txt2img", "progress"].includes(type);
            if (has_proper_type) {
                let encoded = object.data;
                let decoded = JSON.parse(encoded);
                let meta_id =  decoded[type].metadata.id;
                console.log(`type: ${type}, id: ${meta_id}`);

                // get return_func
                // check if it exists
                if(this.idIndex.has(meta_id)){

                    let return_func = this.idIndex.get(meta_id);
                    console.log(`and has return fn in index ${return_func}}`);
                    if(return_func)
                        return_func(object)
                }

            }
        }
    }

    private data_processing(data: Buffer) {
        let compleate_object = this.seg_proc.process(data);
        if (compleate_object){
            console.log('Got compleate object');
            this.redistribute_object(compleate_object);
        }
    }

    public connect(port: number, host: string) {
        if (this.client != undefined)
            return;

        this.client = net.createConnection({ port: port, host: host }, () => {
            console.log(`Connected to ${host}:${port}`);
            if (this.client) {
                let msg: connectMsg = { connect: 1 };
                this._send(this.client, msg);
                // this._send_txt2img(this.client)
            }
        });

        this.client.on('error', (err) => {
            console.error(`Error connecting to ${host}:${port}: ${err.message}`);
        });

        this.client.on('data', (data) => {
            this.data_processing(data);
        });
    }

    private _send(sock: net.Socket, obj: any) {
        let msg_bytes = ComUtils.obj2json2bytes(obj);
        let wrapped_msg = ComUtils.wrap_data(msg_bytes);
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