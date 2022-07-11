const fs = require('fs');
const crypto = require('crypto');

module.exports= class Repository {
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

    async create(attrs) {
        attrs.id = this.randomID();
        
        const records = await this.getAll();
        records.push(attrs);
        await this.writeAll(records);

        return attrs;
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