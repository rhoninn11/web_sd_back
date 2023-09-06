export enum FlowOps {
    NONE = 'none',
    CREATE = 'create',
    DELETE = 'delete',
    CLIENT_SYNC = 'client_sync',
    SERVER_SYNC = 'server_sync',
}

export interface NodePosition {
    x: number;
    y: number;
}

export class RenderData {
    fresh: boolean = false;
}
