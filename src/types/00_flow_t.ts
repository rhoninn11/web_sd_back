export enum FlowOps {
    CREATE = 'create',
    CLIENT_SYNC = 'client_sync',
    UPDATE = 'update',
}

export interface NodePosition {
    x: number;
    y: number;
}

export class RenderData {
    fresh: boolean = false;
}
