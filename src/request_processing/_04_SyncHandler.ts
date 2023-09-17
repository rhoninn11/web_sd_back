import { Client, syncStage } from '../types/types';
import { serverRequest, syncSignature, syncOps } from '../types/02_serv_t';
import { TypedRequestHandler, send_object } from './RequestHandler';
import { EdgeRepo } from '../stores/EdgeRepo';
import { NodeRepo } from '../stores/NodeRepo';
import { ImgRepo } from '../stores/ImgRepo';
import _, { clone } from 'lodash';
import sharp from 'sharp';
import { DBImg } from '../types/03_sd_t';
import { processRGB2webPng_base64 } from '../image_proc';
import { SyncHelper } from '../sync_helper';

export class SyncHandler extends TypedRequestHandler<syncSignature> {
    sync_helper: SyncHelper;

    constructor() {
        super();
        this.type = 'sync';
        this.sync_helper = new SyncHelper();
    }

    private node_realated_transfer(cl: Client, sync_data: syncSignature) {
        let job = new Promise<syncSignature>((resolve, reject) => {
            if (sync_data.node_id_arr.length > 0) {
                let node_id = sync_data.node_id_arr[0];
                let node = NodeRepo.getInstance().get_node_v2(node_id);

                cl.sync_signature.node_id_arr = cl.sync_signature.node_id_arr.filter((id) => id != node_id);
                sync_data.node_data_arr.push(node.db_node);
            }
            resolve(sync_data);
        });

        return job;
    }
    private edge_realated_transfer(cl: Client, sync_data: syncSignature) {
        let job = new Promise<syncSignature>((resolve, reject) => {
            if (sync_data.edge_id_arr.length > 0) {
                let node_id = sync_data.edge_id_arr[0]
                let edge = EdgeRepo.getInstance().get_edge(node_id)
                if (edge) {
                    // remove this id from client state
                    cl.sync_signature.node_id_arr = cl.sync_signature.node_id_arr.filter((id) => id != node_id)
                    sync_data.edge_data_arr.push(edge.db_edge)
                }
            }
            resolve(sync_data);
        });

        return job;
    }

    private process_img(db_img: DBImg) {
        let web_img = new DBImg()
        web_img.id = db_img.id;


        return processRGB2webPng_base64(db_img.img)
            .then((png_img) => {
                web_img.img = png_img;
                return web_img;
            })
    }


    private img_realated_transfer(cl: Client, sync_data: syncSignature) {
        let job = new Promise<syncSignature>((resolve, reject) => {
            let progress = 0;
            if (sync_data.img_id_arr.length > 0) {
                console.log('+++ img realated transfer');
                let node_id = sync_data.img_id_arr[0]
                let db_img = ImgRepo.getInstance().get_img(node_id)
                console.log(`+++ db_img ${db_img}`);
                if (db_img) {
                    let db_img_id = db_img.id
                    // remove this id from client state
                    cl.sync_signature.img_id_arr = cl.sync_signature.img_id_arr.filter((id) => id != db_img_id.toString())
                    this.process_img(db_img)
                        .then((png_img) => {
                            sync_data.img_data_arr.push(png_img);
                            resolve(sync_data);
                        });
                    progress = 1;
                }
            }
            if (progress == 0) resolve(sync_data);
        });
        return job;
    }

    private check_client_sync_state(cl: Client) {
        if (cl.sync_stage == syncStage.INITIAL_SYNC)
            if (cl.sync_signature.empty())
                cl.sync_stage = syncStage.INITIAL_SYNC_DONE;

        if (cl.sync_stage == syncStage.INITIAL_TS_SYNC)
            if (cl.sync_signature.empty())
                cl.sync_stage = syncStage.INITIAL_TS_SYNC_DONE;

    }

    private _on_client_transfer(cl: Client, sync_data: syncSignature, req: serverRequest) {
        let sync_data_out = new syncSignature();
        
        return new Promise<syncSignature>((resolve, reject) => resolve(sync_data))
            .then((sync_data_chain) => this.node_realated_transfer(cl, sync_data_chain))
            .then((sync_data_chain) => this.edge_realated_transfer(cl, sync_data_chain))
            .then((sync_data_chain) => this.img_realated_transfer(cl, sync_data_chain))
            .then((sync_data_chain) => this.img_realated_transfer(cl, sync_data_chain))
            .then((sync_data_chain) => sync_data_out = sync_data_chain)
            .then(() => this.check_client_sync_state(cl))
            .then(() => {
                req.data = this.pack_data(sync_data_out);
                send_object(cl, req);
            });
    }

    private _on_info(cl: Client, sync_data: syncSignature, req: serverRequest) {
        return new Promise<syncSignature>((resolve, reject) => resolve(sync_data))
            .then((sync_data_chain) => this.sync_helper.check_with_server(sync_data_chain))
            .then((sync_data_chain) => {
                cl.sync_stage = syncStage.INITIAL_SYNC;
                cl.sync_signature = sync_data_chain;
                req.data = this.pack_data(sync_data_chain);
                send_object(cl, req);
            })
    }

    private _on_info_ts(cl: Client, sync_data: syncSignature, req: serverRequest) {
        console.log('+++ _on_info_ts', cl.sync_signature);
        if (cl.sync_stage != syncStage.INITIAL_SYNC)
            return;
        console.log('+++ progressed');

        return new Promise<syncSignature>((resolve, reject) => resolve(sync_data))
            .then((sync_data_chain) => this.sync_helper.check_ts_with_server(sync_data_chain))
            .then((sync_data_chain) => {
                console.log('+++ i co znaleziono', sync_data_chain);
                cl.sync_stage = syncStage.INITIAL_TS_SYNC;
                cl.sync_signature = sync_data_chain;
                req.data = this.pack_data(sync_data_chain);
                send_object(cl, req);
            })
    }

    public handle_request(cl: Client, req: serverRequest) {
        let sync_data = this.unpack_data(req.data);
        if (sync_data.sync_op == syncOps.INFO) {
            console.log('+++ syncOps.INFO');
            this._on_info(cl, sync_data, req)
            return;
        }
        
        if (sync_data.sync_op == syncOps.TRANSFER) {
            console.log('+++ syncOps.TRANSFER');
            this._on_client_transfer(cl, sync_data, req)
            return;
        }
        
        if (sync_data.sync_op == syncOps.INFO_TS) {
            console.log('+++ syncOps.INFO_TS');
            this._on_info_ts(cl, sync_data, req)
            return;
        }

    }
}
