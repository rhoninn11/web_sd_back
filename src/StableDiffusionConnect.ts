import net from 'net';

import { connectMsg, disconnectMsg } from './types/types_sd';
import { DBImg, img2img, img64 } from './types/03_sd_t';
import { SDComUtils } from './SDComUtils';

import { ImgRepo } from './stores/ImgRepo';
import { processRGB2webPng_base64 } from './image_proc';
import { txt2img } from './types/03_sd_t';
import { mtdta_JSON_id } from './types/02_serv_t';
import _, { List } from 'lodash';
import { NodeRepo } from './stores/NodeRepo';
import { FlowOps } from './types/00_flow_t';


class SegmentationProcessor {
    private is_reciveing: boolean = false;
    private reciveing_buffer: Buffer = Buffer.alloc(0);
    private reciveing_len: number = 0;

    private try_start_reciving(data: Buffer){
        if (this.is_reciveing)
            return;

        this.reciveing_buffer = Buffer.concat([this.reciveing_buffer, data]);
        if(this.reciveing_buffer.length >= 4){
            this.is_reciveing = true;
            this.reciveing_len = this.reciveing_buffer.readUInt32LE(0) + 4;
        }
    }

    private try_continue_reiving(data: Buffer){
        if (!this.is_reciveing)
            return;

        this.reciveing_buffer = Buffer.concat([this.reciveing_buffer, data]);
    }

    private try_finalize_packet(): Array<any>{
        if (this.reciveing_buffer.byteLength < this.reciveing_len || !this.is_reciveing)
            return [];
        
        let prev_msg = this.reciveing_buffer.subarray(0, this.reciveing_len)
        let rest_of_data = this.reciveing_buffer.subarray(this.reciveing_len)
        // console.log("+++ packet finished: ", prev_msg.length, ", next packet: ", rest_of_data.length, ", total: ", this.reciveing_buffer.length);

        let u_data = SDComUtils.unwrap_data(prev_msg)
        let ceratin_messages = [SDComUtils.bytes2json2obj(u_data)];

        this.is_reciveing = false;
        this.reciveing_buffer = rest_of_data;

        let possible_messages = this.process(Buffer.alloc(0))
        ceratin_messages.concat(possible_messages)

        return ceratin_messages;
    }

    public process(data: Buffer) {
        this.try_continue_reiving(data);
        this.try_start_reciving(data);

        let return_objs = this.try_finalize_packet();
        return return_objs;
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
        let metadata_id = decoded_data[object_in.type].metadata.id;
        let img64: img64 = decoded_data[object_in.type].bulk.img;
        
        let mtdta_id_st: mtdta_JSON_id = JSON.parse(metadata_id);
        
        let db_img = new DBImg;
        db_img.from(img64);
        db_img.user_id = mtdta_id_st.user_id;
        let db_rgb_img = ImgRepo.getInstance().insert_image(db_img);

        let latest_node = NodeRepo.getInstance().get_node_v2(mtdta_id_st.node_id.toString())
        let node_copy = _.cloneDeep(latest_node);
        node_copy.db_node.timestamp = Date.now();
        node_copy.db_node.result_data.prompt_img_id = db_rgb_img.id;
        node_copy.db_node.result_data.prompt_img_type = object_in.type;
        node_copy.db_node.node_op = FlowOps.SERVER_SIDE_UPDATE
        NodeRepo.getInstance().edit_node(node_copy)

        processRGB2webPng_base64(db_rgb_img.img).then((png_img) => {
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
        // console.log(' +SD+ response', type, meta_id);

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
        let compleate_objects = this.seg_proc.process(data);
        compleate_objects.forEach(element => {
            this.pass_object_back(element);
        });
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