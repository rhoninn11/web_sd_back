export enum FlowOps {
    NONE = 'none',
    CREATE = 'create',
    DELETE = 'delete',
}

export interface NodePosition {
    x: number;
    y: number;
}

export class RenderData {
    fresh: boolean = false;
}
