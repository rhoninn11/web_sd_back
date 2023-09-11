import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types/types';
import { NodeRepo } from '../stores/NodeRepo';
import { ServerNode } from '../types/01_node_t';
import { serverRequest } from '../types/02_serv_t';
import { FlowOps } from '../types/00_flow_t';
import { TypedRequestHandler, send_object } from './RequestHandler';


export class NodeUpdateHandler extends TypedRequestHandler<ServerNode> {

    constructor() {
        super();
        this.type = 'serverNode';
    }

    public handle_request(cl: Client, req: serverRequest) {
        let node_data = this.unpack_data(req.data);

        if (node_data.node_op == FlowOps.UPDATE)
            node_data = this.update_node_on_server(cl, node_data);


        req.data = this.pack_data(node_data);
        send_object(cl, req);
    }

    update_node_on_server(cl: Client, node_data: ServerNode): ServerNode {
        let node_repo = NodeRepo.getInstance();
        let server_curated_node_edit = node_repo.edit_node(node_data);

        let edit_node_id = server_curated_node_edit.db_node.id;
        console.log('+++ new node_id', edit_node_id );

        return server_curated_node_edit;
    }


}