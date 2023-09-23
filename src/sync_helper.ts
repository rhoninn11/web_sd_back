import _ from "lodash";
import { EdgeRepo } from "./stores/EdgeRepo";
import { ImgRepo } from "./stores/ImgRepo";
import { NodeRepo } from "./stores/NodeRepo";
import { syncOps, syncSignature } from "./types/02_serv_t";

export class SyncHelper {

    public check_ts_with_server(sync_data: syncSignature) {
        // let new_sync_data = new syncSignature().set_ids(nodes_to_sync, edges_to_sync, imgs_to_sync)

        let db_repo = NodeRepo.getInstance()
        sync_data.node_data_arr.filter((node) => { })

        let recent_nodes = sync_data.node_data_arr.filter((node) => {
            let recent = db_repo.get_node_v2(node.id.toString())
            return recent.db_node.timestamp > node.timestamp
        })

        let new_sync_data = new syncSignature();
        new_sync_data.sync_op = syncOps.INFO_TS;
        new_sync_data.fill_ids(recent_nodes, [], [])
        return new_sync_data

    }

    public check_with_server(sync_data: syncSignature) {
        let db_nodes = NodeRepo.getInstance().get_all_nodes().map((node) => node.db_node)
        let db_edges = EdgeRepo.getInstance().get_all_edges().map((edge) => edge.db_edge)
        let db_imgs = ImgRepo.getInstance().get_all_imgs()
        let serv_node_ids = db_nodes.map((node) => node.id.toString())
        let serv_edge_ids = db_edges.map((edge) => edge.id.toString())
        let serv_img_ids = db_imgs.map((img) => img.id.toString())

        let client_edge_ids = sync_data.edge_id_arr;
        let client_node_ids = sync_data.node_id_arr;
        let client_img_ids = sync_data.img_id_arr;

        let nodes_to_sync = _.difference(serv_node_ids, client_node_ids)
        let edges_to_sync = _.difference(serv_edge_ids, client_edge_ids)
        let imgs_to_sync = _.difference(serv_img_ids, client_img_ids)

        let new_sync_data = new syncSignature()._set_ids(nodes_to_sync, edges_to_sync, imgs_to_sync)
        new_sync_data.sync_op = syncOps.INFO;
        return new_sync_data
    }
}
