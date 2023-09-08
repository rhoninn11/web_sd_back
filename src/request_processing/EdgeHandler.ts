import { v4 as uuidv4 } from 'uuid';
import { Client } from '../types/types';
import { EdgeRepo } from '../stores/EdgeRepo';
import { ServerEdge } from '../types/04_edge_t';
import { serverRequest } from '../types/02_serv_t';
import { FlowOps } from '../types/00_flow_t';
import { TypedRequestHandler, send_object } from './RequestHandler';


export class EdgeHandler extends TypedRequestHandler<ServerEdge> {
    constructor() {
        super();
        this.type = 'serverEdge';
    }

    private create_edge_on_server = (cl: Client, edge_data: ServerEdge) => {
        let edge_repo = EdgeRepo.getInstance();
        edge_data.user_id = cl.auth_id.toString();
        let edge_id = edge_repo.insert_edge(edge_data);
        edge_data.db_edge.id = edge_id;
        return edge_data;
    };

    public handle_request(cl: Client, req: serverRequest) {
        let edge_data = this.unpack_data(req.data);

        if (edge_data.node_op == FlowOps.CREATE)
            edge_data = this.create_edge_on_server(cl, edge_data);

        // if (edge_data.node_op == FlowOps.CLIENT_SYNC)

        req.data = this.pack_data(edge_data);
        send_object(cl, req);
    }
}
