(function () {

    const FILE_ERROR = {
        FILE_EXISTED: '文件已存在',
        Directory_EXISTED: '目录已存在',
        ONLY_FILE_WRITE: '只有文件才能写入',
        NOT_ENTRY: '不是有效的Entry对象'
    }
    const DIR_SEPARATOR = '/'
    const DIR_OPEN_BOUND = String.fromCharCode(DIR_SEPARATOR.charCodeAt(0) + 1);
    // from https://github.com/ebidel/idb.filesystem.js/blob/master/src/idb.filesystem.js
    // When saving an entry, the fullPath should always lead with a slash and never
    // end with one (e.g. a directory). Also, resolve '.' and '..' to an absolute
    // one. This method ensures path is legit!
    function resolveToFullPath(cwdFullPath, path) {
        var fullPath = path;

        var relativePath = path[0] != DIR_SEPARATOR;
        if (relativePath) {
            fullPath = cwdFullPath + DIR_SEPARATOR + path;
        }

        // Normalize '.'s,  '..'s and '//'s.
        var parts = fullPath.split(DIR_SEPARATOR);
        var finalParts = [];
        for (var i = 0; i < parts.length; ++i) {
            var part = parts[i];
            if (part === '..') {
                // Go up one level.
                if (!finalParts.length) {
                    throw Error('Invalid path');
                }
                finalParts.pop();
            } else if (part === '.') {
                // Skip over the current directory.
            } else if (part !== '') {
                // Eliminate sequences of '/'s as well as possible leading/trailing '/'s.
                finalParts.push(part);
            }
        }

        fullPath = DIR_SEPARATOR + finalParts.join(DIR_SEPARATOR);

        // fullPath is guaranteed to be normalized by construction at this point:
        // '.'s, '..'s, '//'s will never appear in it.

        return fullPath;
    }

    class FileError {
        constructor({ code = 999, message = '未知错误' } = { code: 999, message: '未知错误' }) {
            this.code = code
            this.message = message
        }
    }
    class Metadata {
        constructor(modificationTime, size) {
            this.modificationTime = modificationTime
            this.size = size
        }
    }
    class FSFile {
        constructor(name, size, type, lastModifiedDate, blob) {
            this.name = name
            this.size = size
            this.type = type
            this.lastModifiedDate = lastModifiedDate
            this.blob = blob
        }
    }

    const NOT_IMPLEMENTED_ERROR = new FileError({
        code: 1000,
        name: '方法未实现'
    }),
        NOT_FOUND_ERROR = new FileError({
            code: 404,
            name: '未找到'
        }),
        NOT_SUPPORTED = new Error('indexedDB的支持程度太低')

    class Entry {

        constructor(isFile = true, isDirectory = false, name, fullPath) {
            this.isFile = isFile
            this.isDirectory = isDirectory
            this.name = name
            this.fullPath = fullPath
        }

        /**
         * 获取元数据 done
         */
        getMetadata() {
            return this._dispatch('getMetadata')
        }

        moveTo(parent, newName) {
            throw NOT_IMPLEMENTED_ERROR
            //this._dispatch('moveTo', [...arguments])
        }

        copyTo(parent, newName) {
            throw NOT_IMPLEMENTED_ERROR
            // this._dispatch('copyTo', [...arguments])
        }

        toURL() {
            throw NOT_IMPLEMENTED_ERROR
            //this._dispatch('toURL')
        }

        /**
         * 删除  done
         */
        remove() {
            return this._dispatch('remove')
        }


        getParent() {
            return this._dispatch('getParent')
        }
    }

    Entry.prototype._dispatch = function (method, ...args) {
        return new Promise((resolve) => {
            if (FileSystem._instance) {
                return resolve(FileSystem._instance[method].call(FileSystem._instance, this, ...args))
            } else {
                FileSystem.getInstance().then(fs => {
                    FileSystem._instance = fs
                    return resolve(FileSystem._instance[method].call(fs, this, ...args))
                })
            }
        })
    }
    Entry.copyFrom = function (entry) {
        return entry.isFile ? new FileEntry(entry.name, entry.fullPath, entry.file) :
            new DirectoryEntry(entry.name, entry.fullPath)
    }

    class FileEntry extends Entry {
        constructor(name, fullPath, file) {
            super(true, false, name, fullPath)
            this.file = file
        }

        /**
         * FileEntry写入数据 done
         * @param {Blob|String|BufferArray} content 
         * @param {String} type 
         * @param {Boolean} append 
         */
        write(content, type = 'text/plain', append = false) {
            return this._dispatch('write', content, type, append)
        }
    }

    class DirectoryEntry extends Entry {
        constructor(name, fullPath) {
            super(false, true, name, fullPath)
        }

        /**
         * 获取文件 done
         * @param {String} path 路径
         * @param {Object} options  create:是否创建 ， exclusive 排他
         */
        getFile(path, options = { create: true, exclusive: false }) {
            return this._dispatch('getFile', path, options)
        }

        /**
         * 获取目录 done
         * @param {String} path 
         * @param {Object} options 
         */
        getDirectory(path, options = { create: true, exclusive: false }) {
            return this._dispatch('getDirectory', path, options)
        }

        /**
         * 递归删除 done
         */
        removeRecursively() {
            return this._dispatch('removeRecursively')
        }

        /**
         * 获取目录下的目录和文件
         */
        getEntries() {
            return this._dispatch('getEntries')
        }
    }


    class FileSystem {

        constructor() {
            // DB
            this._db = null
            // 实例
            this._instance = null
            // store Name
            this._storeName = FileSystem._storeName
            // root
            this.root = null
        }

        static getInstance(dbVersion = 1.0) {
            if (!FileSystem.isSupported) {
                throw NOT_SUPPORTED
            }
            if (this._instance) {
                Promise.resolve(this._instance)
            }
            return new Promise((resolve, reject) => {
                let request = self.indexedDB.open(FileSystem._dbName, dbVersion)
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
                            this._instance = new FileSystem()
                            this._instance._db = request.result
                            this._instance.root = new DirectoryEntry('/', '/')
                            FileSystem._instance = this._instance
                            return resolve(this._instance)
                        }
                    } else {
                        this._instance = new FileSystem()
                        this._instance._db = request.result
                        this._instance.root = new DirectoryEntry('/', '/')
                        FileSystem._instance = this._instance
                        return resolve(this._instance)
                    }
                }
                request.onupgradeneeded = event => {
                    event.target.result.createObjectStore(this._storeName)
                }
            })
        }

        get transaction() {
            return this._db.transaction([this._storeName], IDBTransaction.READ_WRITE || 'readwrite')
        }

        _toPromise(method, ...args) {
            try {
                let suc
                if (args.length >= 1 && typeof args[args.length - 1] === 'function') {
                    suc = args[args.length - 1]
                    args = args.slice(0, args.length - 1)
                }

                return new Promise((resolve, reject) => {
                    // 获得事务
                    let trans = this.transaction
                    // 获得请求
                    let req = trans.objectStore(this._storeName)[method](...args)
                    // 请求成功
                    if (['openCursor', 'openKeyCursor'].indexOf(method) >= 0 && suc) { //游标
                        req.onsuccess = function (event) {
                            suc(event)
                        }
                        trans.oncomplete = function () {
                            return resolve()
                        }
                        trans.onsuccess = function () {
                            return resolve()
                        }
                    }
                    else {
                        req.onsuccess = event => resolve(event.target.result)
                    }
                    // 请求失败
                    req.onerror = event => reject(req.error)
                    // 事务失败
                    trans.onerror = event => reject(trans.error)
                })
            } catch (err) {
                Promise.reject(err)
            }
        }

        /**
         * TODO::// 暂不支持 append
         * @param {Entry} entry 
         * @param {写入的内容} content 
         * @param {blob类型} type 
         * @param {是否是append模式} append 
         */
        write(entry, content, type = 'text/plain', append = false) {
            this._checkEntry(entry)
            if (entry.isFile !== true) {
                throw new FileError({ message: FILE_ERROR.ONLY_FILE_WRITE })
            }
            let data = content
            // 不是blob，转为blob
            if (content instanceof ArrayBuffer) {
                data = new Blob([new Uint8Array(content)], { type })
            } else if (typeof content === 'string') {
                data = new Blob([content], { type: 'text/plain' })
            } else {
                data = new Blob([content], { type })
            }
            let file = entry.file
            if (!file) { // 不存在创建
                file = new FSFile(path.split(DIR_SEPARATOR).pop(), data.size, type, new Date(), data)
                entry.file = file
            } else { //存在更新
                file.lastModifiedDate = new Date()
                file.type = type
                file.size = data.size
                file.blob = data
            }

            return this._toPromise('put', entry, entry.fullPath).then(() => entry)
        }

        /**
         * 
         * @param {Entry} entry 
         * @param {String} path 
         * @param {Object} create 是否创建  exclusive排他
         */
        getFile(entry, path, { create, exclusive }) {
            return this.getEntry(...arguments, true)
        }

        getDirectory(entry, path, { create, exclusive }) {
            return this.getEntry(...arguments, false)
        }

        remove(entry) {
            this._checkEntry(entry)
            return this._toPromise('delete', entry.fullPath).then(() => true)
        }

        removeRecursively(entry) {
            this._checkEntry(entry)
            var range = IDBKeyRange.bound(entry.fullPath, entry.fullPath + DIR_OPEN_BOUND, false, true);
            return this._toPromise('delete', range).then(() => true)
        }

        /**
         * 获得元数据
         * @param {Entry} entry 
         */
        getMetadata(entry) {
            let f = entry.file || {}
            return new Metadata(f && f.lastModifiedDate || null, f && f.size || 0)
        }

        /**
         * 获取文件或者目录
         * @param {Entry} entry 
         * @param {String} path 
         * @param {String} param2 
         * @param {Boolean} getFile true获取文件 false 获取目录
         */
        getEntry(entry, path, { create, exclusive = false }, getFile = true) {
            this._checkEntry(entry)
            path = resolveToFullPath(entry.fullPath, path)
            return this._toPromise('get', path).then(fe => {
                if (create === true && exclusive === true && fe) { //创建 && 排他 && 存在
                    throw new FileError({
                        message: getFile ? FILE_ERROR.FILE_EXISTED : FILE_ERROR.Directory_EXISTED
                    })
                } else if (create === true && !fe) { //创建 && 文件不存在
                    let name = path.split(DIR_SEPARATOR).pop(),
                        newEntry = getFile ? new FileEntry(name, path) : new DirectoryEntry(name, path),
                        fileE = getFile ? new FSFile(name, 0, null, new Date(), null) : null
                    if (getFile) newEntry.file = fileE
                    return this._toPromise('put', newEntry, newEntry.fullPath).then(() => {
                        return Entry.copyFrom(newEntry)
                    })
                } else if (!create && !fe) {// 不创建 && 文件不存在
                    throw NOT_FOUND_ERROR
                } else if ((!create && fe && fe.isDirectory && getFile) || (!create && fe && fe.isDirectory && getFile)) { // 不创建 && 文件存在 && 文件是目录
                    throw new FileError({
                        message: FILE_ERROR.Directory_EXISTED
                    })
                } else {
                    return Entry.copyFrom(fe)
                }
            })

        }

        /**
         * 获得父目录
         * @param {Entry} entry 
         */
        getParent(entry) {
            this._checkEntry(entry)
            if (entry.fullPath === DIR_SEPARATOR) { // 已经是根目录
                return entry
            }
            let parentFullPath = entry.fullPath.substring(0, entry.fullPath.lastIndexOf(DIR_SEPARATOR))
            //上级目录为根目录的情况
            if (parentFullPath === '') {
                return this.root
            }
            return this.getDirectory(this.root, parentFullPath, { create: false }, false)
        }

        /**
         * 获得目录下的目录和文件
         * @param {Entry} entry 
         */
        getEntries(entry) {
            let range = null,
                results = []
            if (entry.fullPath != DIR_SEPARATOR && entry.fullPath != '') {
                //console.log(fullPath + '/', fullPath + DIR_OPEN_BOUND)
                range = IDBKeyRange.bound(
                    fullPath + DIR_SEPARATOR, fullPath + DIR_OPEN_BOUND, false, true);
            }
            //TODO::为嘛用游标？
            let valPartsLen, fullPathPartsLen
            return this._toPromise('openCursor', range, function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    var val = cursor.value;
                    valPartsLen = val.fullPath.split(DIR_SEPARATOR).length;
                    fullPathPartsLen = entry.fullPath.split(DIR_SEPARATOR).length;
                    // 区分根目录和非根目录
                    if ((entry.fullPath == DIR_SEPARATOR && valPartsLen < fullPathPartsLen + 1) ||
                        (entry.fullPath != DIR_SEPARATOR && valPartsLen == fullPathPartsLen + 1)) {
                        results.push(val.isFile ? new FileEntry(val.name, val.fullPath, val.file) : new DirectoryEntry(val.name, val.fullPath));
                    }
                    cursor['continue']();
                }
            }).then(() => results)
        }

        /**
         * 检查Entry
         * @param {*Entry} entry 
         */
        _checkEntry(entry) {
            if (!entry || !(entry instanceof Entry)) {
                throw new FileError({ message: FILE_ERROR.NOT_ENTRY })
            }
        }

        //TODO::递归检查和创建DirectoryEntry
        _ensureDirectory(entry) {
            throw NOT_IMPLEMENTED_ERROR
        }
    }


    FileSystem.isSupported = () => {
        self.indexedDB_ = self.indexedDB || self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB
        self.IDBTransaction = self.IDBTransaction || self.webkitIDBTransaction || self.msIDBTransaction
        self.IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange || self.msIDBKeyRange
        return !!(self.indexedDB && self.IDBTransaction && self.IDBKeyRange)
    }

    FileSystem._dbName = '_fs_db_'
    FileSystem._storeName = '_fs_store'


    self.Entry = Entry
    self.FileEntry = FileEntry
    self.DirectoryEntry = DirectoryEntry
    self.FileSystem = FileSystem

})(self)




