let _w_ = window
_indexedDB_ = _w_.indexedDB || _w_.mozIndexedDB || _w_.webkitIndexedDB || _w_.msIndexedDB
_w_.IDBTransaction = _w_.IDBTransaction || _w_.webkitIDBTransaction || _w_.msIDBTransaction
_w_.IDBKeyRange = _w_.IDBKeyRange || _w_.webkitIDBKeyRange || _w_.msIDBKeyRange

class IDBProvider {

    constructor() {
        // DB
        this._db = null
        // 实例
        this._instance = null
        // store Name
        this._storeName = IDBProvider._storeName
    }

    get transaction() {
        return this._db.transaction([this._storeName], IDBTransaction.READ_WRITE || 'readwrite')
    }

    _toPromise(method, ...args) {
        try {
            return new Promise((resolve, reject) => {
                // 获得事务
                let trans = this.transaction
                // 获得请求
                let req = trans.objectStore(this._storeName)[method](...args)
                // 请求成功
                req.onsuccess = event => resolve(event.target.result)
                // 请求失败
                req.onerror = event => reject(req.error)
                // 事务失败
                trans.onerror = event => reject(trans.error)
            })
        } catch (err) {
            Promise.reject(err)
        }
    }

    static getInstance(dbVersion = 1.0) {
        if (this._instance) {
            Promise.resolve(this._instance)
        }
        return new Promise((resolve, reject) => {
            let request = _indexedDB_.open(IDBProvider._dbName, dbVersion)
            request.onerror = event => {
                return reject(null)
            }
            request.onsuccess = event => {
                let db = request.result
                // 老版本，新版本是onupgradeneeded
                if (db.setVersion && db.version !== dbVersion) {
                    var setVersion = db.setVersion(dbVersion);
                    setVersion.onsuccess = function () {
                        db.createObjectStore(this._storeName)
                        this._instance = new IDBProvider()
                        this._instance._db = request.result
                        return resolve(this._instance)
                    }
                } else {
                    this._instance = new IDBProvider()
                    this._instance._db = request.result
                    return resolve(this._instance)
                }
            }
            request.onupgradeneeded = event => {
                event.target.result.createObjectStore(this._storeName)
            }
        })
    }

    /**
     * 获取文件 
     * @param {*String} path 
     */
    getFile(path) {
        return this._toPromise('get', path)
    }

    /**
     * 写入文件
     * @param {*String} path 路径
     * @param {*String|Blob} content 内容 
     * @param {*String} type 
     * @param {*String} append 暂无用
     */
    async writeToFile(path, content, type = null, append = false) {
        let data = content
        // 不是blob，转为blob
        if (content instanceof ArrayBuffer) {
            data = new Blob([new Uint8Array(content)], { type })
        } else if (typeof content === 'string') {
            data = new Blob([content], { type: 'text/plain' })
        } else {
            data = new Blob([content])
        }
        await this._toPromise('put', data, path)
        return this.getFile(path)

        /*
        return new Promise((resolve, reject) => {
            let data = content
            // 不是blob，转为blob
            if (content instanceof ArrayBuffer) {
                data = new Blob([new Uint8Array(content)], { type })
            } else if (typeof content === 'string') {
                data = new Blob([content])
            }
 
            // 存入数据
            let trans = this.transaction
            trans.objectStore(this._storeName).put(data, path)
 
            trans.objectStore(this._storeName).get(path).onsuccess = event => {
                resolve(event.target.result)
            }
 
            trans.onerror = event => {
                reject(trans.error)
            }
        }) */
    }

    readEntries(path = '') {
        if (!path) {
            return this.readAllEntries()
        }
        return this._toPromise('getAllKeys', IDBKeyRange.lowerBound(path)).then(r => r.filter(p => {
            // 以当前路径开头 && （截断当前为空字符串，或者截断后以/开头）
            return p.indexOf(path) === 0 && (p.substring(path.length) === '' || p.substring(path.length).indexOf('/') === 0)
        }))
    }

    readAllEntries() {
        return this._toPromise('getAllKeys')
    }

    ensureDirectory(directory = '') {
        return Promise.resolve(directory)
    }

    clear() {
        return this._toPromise('clear').then(r => true)
    }

    /**
     * 加工处理path，比如特殊字符，比如以/开头等等
     * @param {*String} path 
     */
    _handlePath(path) {
        return path
    }
}

IDBProvider._dbName = '_fs_db_'
IDBProvider._storeName = '_fs_store'


// 测试语句
// 读取某个目录的子目录和文件：  IDBProvider.getInstance().then(fs=>fs.readEntries()).then(f=>console.log(f))
// 写文件         IDBProvider.getInstance().then(fs=>fs.writeToFile('music/txt.txt','爱死你')).then(f=>console.log(f))
// 获取文件：     IDBProvider.getInstance().then(fs=>fs.getFile('music/txt.txt')).then(f=>console.log(f))
// 递归创建目录：  IDBProvider.getInstance().then(fs=>fs.ensureDirectory('music/vbox')).then(r=>console.log( r))
// 递归获取：     IDBProvider.getInstance().then(fs=>fs.readAllEntries()).then(f=>console.log(f))
// 删除所有：     IDBProvider.getInstance().then(fs=>fs.clear()).then(f=>console.log(f)).catch(err=>console.log(err)) 
