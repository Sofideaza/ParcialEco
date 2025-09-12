const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'db');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = {
    save(collection, data) {
        const filePath = path.join(DB_DIR, `${collection}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    },

    load(collection) {
        const filePath = path.join(DB_DIR, `${collection}.json`);
        if (!fs.existsSync(filePath)) {
            if (collection === 'auction') {
                return { isOpen: false, endTime: null };
            }
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    },

    add(collection, item) {
        const data = this.load(collection);
        if (Array.isArray(data)) {
            data.push(item);
        } else {
            return Object.assign(data, item);
        }
        this.save(collection, data);
        return item;
    },

    find(collection, predicate) {
        const data = this.load(collection);
        if (Array.isArray(data)) {
            return data.find(predicate);
        }
        return data;
    },

    findAll(collection, predicate) {
        const data = this.load(collection);
        if (Array.isArray(data)) {
            return predicate ? data.filter(predicate) : data;
        }
        return data;
    }
};

module.exports = db;