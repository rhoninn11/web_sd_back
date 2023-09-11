import { Client, syncStage } from '../types/types';
import { serverRequest, syncSignature, syncOps } from '../types/02_serv_t';
import { TypedRequestHandler, send_object } from './RequestHandler';
import { EdgeRepo } from '../stores/EdgeRepo';
import { NodeRepo } from '../stores/NodeRepo';
import { ImgRepo } from '../stores/ImgRepo';
import _, { clone } from 'lodash';
import sharp from 'sharp';
import { DBImg } from '../types/03_sd_t';

export class SyncHandler extends TypedRequestHandler<syncSignature> {
    constructor() {
        super();
        this.type = 'sync';
    }

    private check_with_server(sync_data: syncSignature) {
        let db_nodes = NodeRepo.getInstance().get_all_nodes().map((node) => node.db_node)
        let db_edges = EdgeRepo.getInstance().get_all_edges().map((edge) => edge.db_edge)
        let db_imgs = ImgRepo.getInstance().get_all_imgs()
        let serv_node_ids = db_nodes.map((node) => node.id.toString())
        let serv_edge_ids = db_edges.map((edge) => edge.id.toString())
        let serv_img_ids = db_imgs.map((img) => img.id.toString())

        let client_edge_ids = sync_data.edge_id_arr;
        let client_node_ids = sync_data.node_id_arr;
        let client_img_ids = sync_data.img_id_arr;

        console.log(client_node_ids)
        console.log(client_edge_ids)
        console.log(client_img_ids)

        console.log('+++ server nodes (', serv_node_ids.length, ')  <---> client nodes (', client_node_ids.length, ')')
        console.log('+++ server edges (', serv_edge_ids.length, ')  <---> client edges (', client_edge_ids.length, ')')
        console.log('+++ server imgs (', serv_img_ids.length, ')  <---> client imgs (', client_img_ids.length, ')')

        console.log(serv_node_ids)
        console.log(serv_edge_ids)
        console.log(serv_img_ids)

        let nodes_to_sync = _.difference(serv_node_ids, client_node_ids)
        let edges_to_sync = _.difference(serv_edge_ids, client_edge_ids)
        let imgs_to_sync = _.difference(serv_img_ids, client_img_ids)

        console.log('+++ nodes diference')
        console.log(nodes_to_sync)
        console.log('+++ edges diference')
        console.log(edges_to_sync)
        console.log('+++ img diference')
        console.log(edges_to_sync)

        let new_sync_data = new syncSignature().set_ids(nodes_to_sync, edges_to_sync, imgs_to_sync)
        new_sync_data.sync_op = syncOps.INFO;
        return new_sync_data
    }

    private node_realated_transfer(cl: Client, sync_data: syncSignature) {
        let job = new Promise<syncSignature>((resolve, reject) => {
            if (sync_data.node_id_arr.length > 0) {
                let node_id = sync_data.node_id_arr[0];
                let node = NodeRepo.getInstance().get_node(node_id);
                if (node) {
                    // remove this id from client state
                    cl.sync_signature.node_id_arr = cl.sync_signature.node_id_arr.filter((id) => id != node_id);
                    sync_data.node_data_arr.push(node.db_node);
                }
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

    private process_img(cl: Client, sync_data: syncSignature, db_img: DBImg, resolve_cb: (sync_data_out: syncSignature) => void) {
        let web_img = new DBImg()
        web_img.id = db_img.id;
        web_img.img.id = db_img.img.id;
        web_img.img.x = db_img.img.x;
        web_img.img.y = db_img.img.y;

        // remove this id from client state
        cl.sync_signature.img_id_arr = cl.sync_signature.img_id_arr.filter((id) => id != db_img.id.toString())
        let rgb = Buffer.from(db_img.img.img64, 'base64');
        sharp(rgb, { raw: { width: db_img.img.x, height: db_img.img.y, channels: 3 } })
            .webp({ quality: 100 })
            .toBuffer((err, buffer, info) => {
                let base64 = buffer.toString('base64');
                let prefix = `data:image/webp;base64,`
                web_img.img.img64 = prefix + base64;
                web_img.img.mode = "webp";
                sync_data.img_data_arr.push(web_img)
                resolve_cb(sync_data);
            });
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
                    progress = 1;
                    this.process_img(cl, sync_data, db_img, (sync_data_out) => resolve(sync_data_out));
                }
            }
            if (progress == 0) resolve(sync_data);
        });
        return job;
    }

    public handle_request(cl: Client, req: serverRequest) {
        let sync_data = this.unpack_data(req.data);
        if (sync_data.sync_op == syncOps.INFO) {
            sync_data = this.check_with_server(sync_data);
            cl.sync_stage = syncStage.INITIAL_SYNC;
            cl.sync_signature = sync_data;
            req.data = this.pack_data(sync_data);
            send_object(cl, req);
        }

        if (sync_data.sync_op == syncOps.TRANSFER) {
            this.node_realated_transfer(cl, sync_data)
            .then((sync_data_chain) => this.edge_realated_transfer(cl, sync_data_chain))
            .then((sync_data_chain) => this.img_realated_transfer(cl, sync_data_chain))
            .then((sync_data_chain) => {
                req.data = this.pack_data(sync_data_chain);
                send_object(cl, req);
            });
        }
    }
}
