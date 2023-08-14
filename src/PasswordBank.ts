import { Client } from "./types";


export class PasswordBank {
    private password_idx: { password: string, inUse: boolean }[];
    private static instance: PasswordBank;
    private constructor() {
        this.password_idx = [
            { password: 'pulsary55.', inUse: false },
        ]
     }

    public static getInstance(): PasswordBank {
        if (!PasswordBank.instance)
            PasswordBank.instance = new PasswordBank();

        return PasswordBank.instance;
    }

    public check_password = (cl: Client, pass: string) => {
        let result = false;
        this.password_idx.forEach((item, idx, array) => {
            if (item.password == pass, item.inUse == false) {
                item.inUse = true;
                result = true;
                cl.auth = idx;
            }
        });

        if (result) console.log('Password accepted!');
        else console.log('Password rejected!');

        return result;
    }
    public release_password = (cl: Client) => {
        let auth_id = cl.auth
        if (auth_id != -1){
            console.log('Releasing password: ' + auth_id);
            this.password_idx[auth_id].inUse = false;
        }
    }

}

/**
 * The client code.
 */
function clientCode() {
    const s1 = PasswordBank.getInstance();
    const s2 = PasswordBank.getInstance();

    if (s1 === s2) {
        console.log('Singleton works, both variables contain the same instance.');
    } else {
        console.log('Singleton failed, variables contain different instances.');
    }
}

clientCode();