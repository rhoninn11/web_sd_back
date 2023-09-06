import { Client, syncStage } from '../types/types';
import { serverRequest, syncSignature, syncOps } from '../types/02_serv_t';
import { TypedRequestHandler, send_object } from './RequestHandler';
import { EdgeRepo } from '../stores/EdgeRepo';
import { NodeRepo } from '../stores/NodeRepo';
import _ from 'lodash';

export class SyncHandler extends TypedRequestHandler<syncSignature> {
    constructor() {
        super();
        this.type = 'sync';
    }

    private check_with_server(sync_data: syncSignature){

        let db_nodes = NodeRepo.getInstance().get_all_nodes().map((node) => node.db_node)
        let db_edges = EdgeRepo.getInstance().get_all_edges().map((edge) => edge.db_edge)
        let serv_node_ids = db_nodes.map((node) => node.serv_id)
        let serv_edge_ids = db_edges.map((edge) => edge.serv_id)

        let client_node_ids = sync_data.edge_id_arr;
        let client_edge_ids = sync_data.node_id_arr;

        let nodes_to_sync = _.difference(serv_node_ids, client_node_ids)
        let edges_to_sync = _.difference(serv_edge_ids, client_edge_ids)

        let new_sync_data = new syncSignature().set_ids(nodes_to_sync, edges_to_sync)
        new_sync_data.sync_op = syncOps.INFO;
        return new_sync_data
    }

    private node_realated_transfer(cl: Client, sync_data: syncSignature){
        if(sync_data.node_id_arr.length > 0 ){
            let node_id = sync_data.node_id_arr[0]
            let node = NodeRepo.getInstance().get_node(node_id)
            if(node){
                // remove this id from client state
                cl.sync_signature.node_id_arr = cl.sync_signature.node_id_arr.filter((id) => id != node_id)
                sync_data.node_data_arr.push(node.db_node)
            }
        }
    }
    private edge_realated_transfer(cl: Client, sync_data: syncSignature){
        if(sync_data.edge_id_arr.length > 0 ){
            let node_id = sync_data.edge_id_arr[0]
            let edge = EdgeRepo.getInstance().get_edge(node_id)
            if(edge){
                // remove this id from client state
                cl.sync_signature.node_id_arr = cl.sync_signature.node_id_arr.filter((id) => id != node_id)
                sync_data.edge_data_arr.push(edge.db_edge)
            }
        }
    }

    public handle_request(cl: Client, req: serverRequest) {
        let sync_data = this.unpack_data(req.data);
        console.log('Sync request received from client: ' + sync_data.sync_op);
        if (sync_data.sync_op == syncOps.INFO) {
            sync_data = this.check_with_server(sync_data);
            cl.sync_stage = syncStage.INITIAL_SYNC;
            cl.sync_signature = sync_data;
        }
        
        if (sync_data.sync_op == syncOps.TRANSFER) {
            this.node_realated_transfer(cl, sync_data)
            this.edge_realated_transfer(cl, sync_data)
        }

        req.data = this.pack_data(sync_data);
        send_object(cl, req);
    }
}
