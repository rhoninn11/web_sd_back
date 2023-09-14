import { Client } from '../types/types';
import { PasswordBank } from '../PasswordBank';
import { authData, serverRequest } from '../types/02_serv_t';
import { TypedRequestHandler, send_object } from './RequestHandler';


export class AuthHandler extends TypedRequestHandler<authData> {
    constructor() {
        super();
        this.type = 'auth';
    }

    public try_auth_user = (cl: Client, pass: string) => {
        let passwd_idx = PasswordBank.getInstance().check_password(pass);
        cl.auth_id = passwd_idx;
        return passwd_idx > -1;
    };

    public handle_request(cl: Client, req: serverRequest) {
        let auth_data = this.unpack_data(req.data);
        let pwd = auth_data.password;
        auth_data.password = "*".repeat(pwd.length);
        auth_data.auth = this.try_auth_user(cl, pwd);
        auth_data.user_id = cl.auth_id;
        req.data = this.pack_data(auth_data);
        send_object(cl, req);
    }
}


