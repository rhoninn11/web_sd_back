import { TypedRequestHandler } from './RequestHandler';


export class HandlerRepository {
    protected processors: TypedRequestHandler<any>[] = [];
    private static instance: HandlerRepository;

    private constructor() {
    }

    public register_handler(processor: TypedRequestHandler<any>) {
        this.processors.push(processor);
        console.log('+++ new processore registered', processor.type);
        return this;
    }
    public static getInstance(): HandlerRepository {
        if (!HandlerRepository.instance) {
            HandlerRepository.instance = new HandlerRepository();
        }

        return HandlerRepository.instance;
    }

    public get_handler(type: string): TypedRequestHandler<any> | undefined {
        let processor = this.processors.find(processor => processor.match_type(type));
        return processor;
    }
}
