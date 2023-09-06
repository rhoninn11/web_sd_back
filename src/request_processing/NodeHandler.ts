import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types/types';
import { NodeRepo } from '../stores/NodeRepo';
import { ServerNode } from '../types/01_node_t';
import { serverRequest } from '../types/02_serv_t';
import { FlowOps } from '../types/00_flow_t';
import { TypedRequestHandler, send_object } from './RequestHandler';


export class NodeHandler extends TypedRequestHandler<ServerNode> {

    constructor() {
        super();
        this.type = 'serverNode';
    }


    public handle_request(cl: Client, req: serverRequest) {
        let node_data = this.unpack_data(req.data);

        if (node_data.node_op == FlowOps.CREATE)
            node_data = this.create_node_on_server(cl, node_data);

        if (node_data.node_op == FlowOps.CLIENT_SYNC)
            this.sync_node_on_server(node_data);

        req.data = this.pack_data(node_data);
        send_object(cl, req);
    }

    create_node_on_server(cl: Client, node_data: ServerNode): ServerNode {
        let node_repo = NodeRepo.getInstance();
        let uuid = uuidv4();
        node_data.db_node.serv_id = uuid;
        node_data.user_id = cl.auth_id.toString();
        node_repo.insert_node(uuid, node_data);

        return node_data;
    }

    sync_node_on_server(node_data: ServerNode) {
        let node_repo = NodeRepo.getInstance();
        node_repo.insert_node(node_data.db_node.serv_id, node_data);
        console.log(`+++ sync node ${node_data.db_node.serv_id}`);
    }
}
