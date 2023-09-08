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

        // if (node_data.node_op == FlowOps.CLIENT_SYNC)

        req.data = this.pack_data(node_data);
        send_object(cl, req);
    }

    create_node_on_server(cl: Client, node_data: ServerNode): ServerNode {
        let node_repo = NodeRepo.getInstance();
        node_data.user_id = cl.auth_id.toString();
        let node_id = node_repo.insert_node(node_data);
        node_data.db_node.id = parseInt(node_id);

        return node_data;
    }


}
