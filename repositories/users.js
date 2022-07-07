const fs =require('fs');
const crypto = require('crypto');
const util = require('util')

const scrypt = util.promisify(crypto.scrypt);

class UsersRepository {
    constructor (filename){
        if(!filename) {
            throw new Error('Creating a repo requires a filename');
        }

        this.filename = filename;

        try{
            fs.accessSync(this.filename);
        }
        catch (err){
            fs.writeFileSync(this.filename, '[]');
        }
    }

    async getAll() {
        /*
        //open file
        const contents = await fs.promises.readFile(this.filename, {
            encoding: 'utf8'
        });
        //read
        console.log(contents);
        //parse
        const data = JSON.parse(contents);
        //return
        return data;
        */

        //refactored code
        return JSON.parse(
            await fs.promises.readFile(this.filename, {
                encoding: 'utf8' //default
            }) 
        );
    }

    async create(attrs){
        // attrs === {email, password}
        attrs.id = this.randomID();
        const salt = crypto.randomBytes(8).toString('hex');
        //scrypt(attrs.password, salt, 64, (err, buf) => {
        //  const hashed = buf.toString('hex');
        //});

        const buf = await scrypt(attrs.password, salt, 64);

        const records = await this.getAll();
        const record = {
            ...attrs,
            password: `${buf.toString('hex')}.${salt}`
        };
        records.push(record);

        await this.writeAll(records);

        return record;
    }

    async comparePassword(saved, supplied){
        const [hashed, salt] = saved.split('.');
        const hashedSuppliedBuf = await scrypt(supplied, salt, 64);
        
        return hashed === hashedSuppliedBuf.toString('hex');
    }


    async writeAll(records){
        await fs.promises.writeFile(this.filename, JSON.stringify(records, null, 2)); // 
    }

    randomID() {
        return crypto.randomBytes(4).toString('hex');
    }

    async getOne(id){
        const records = await this.getAll();
        return records.find(record => record.id === id);
    }

    async delete(id){
        const records = await this.getAll();
        const filteredRecords = records.filter(record => record.id !== id);
        await this.writeAll(filteredRecords);
    }

    async update(id,attrs) {
        const records = await this.getAll();
        const record = records.find(record => record.id === id);

        if(!record){
            throw new Error (`Record with id ${id} not found.`)
        }

        Object.assign(record, attrs);
        await this.writeAll(records);
    }

    async getOneBy(filters) {
        const records = await this.getAll();
         
        for (let record of records){    //array
            let found = true;
            for (let key in filters){   //object
                if(record[key] !== filters[key]){
                    found = false;
                }
            }
            if(found){
                return record;
            }
        } 
    }
}

/*
const test = async () => {
    const repo = new UsersRepository('users.json');
    //await repo.create({email : "test@test.com", password : "password"});
    //const users = await repo.getAll();
    //const user = await repo.getOne('13a3bd42');
    //console.log(user);
    //await repo.delete("13a3bd42");
    //await repo.create({email : "test@test.com"});
    //await repo.update("fbdafac8", {password: 'mypassword'});
    const user = await repo.getOneBy({email : "test@test.com"});
    console.log(user);
};

test();
*/

module.exports =  new UsersRepository('users.json');