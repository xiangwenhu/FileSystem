let _w_ = window
_w_.indexedDB = _w_.indexedDB || _w_.mozIndexedDB || _w_.webkitIndexedDB || _w_.msIndexedDB
_w_.IDBTransaction = _w_.IDBTransaction || _w_.webkitIDBTransaction || _w_.msIDBTransaction
_w_.IDBKeyRange = _w_.IDBKeyRange || _w_.webkitIDBKeyRange || _w_.msIDBKeyRange


class IDBProvider {
    

    constructor() {
        // DB
        this._db = null
        // 实例
        this._instance = null

    }

    static getInstance() {
        if(this._instance){
            Promise.resolve(this._instance)
        }
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(IDBProvider._storeName, 1)
            request.onerror = event => {
                reject(null)
            };
            request.onsuccess = event => {
                this._instance = new IDBProvider()
                this._instance._db = request.result
                resolve(this._instance)
            };
        })
    }
}

IDBProvider._storeName = '_fs_system_'