export enum FlowOps {
    NONE = 'none',
    CREATE = 'create',
    UPDATE = 'update',
    SERVER_SIDE_UPDATE = 'server_side_update',
}

export interface NodePosition {
    x: number;
    y: number;
}

export class RenderData {
    fresh: boolean = false;
}
