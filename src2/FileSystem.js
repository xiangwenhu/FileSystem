(function () {

    const FILE_ERROR = {
        FILE_EXISTED: '文件已存在',
        Directory_EXISTED: '目录已存在'
    }
    const DIR_SEPARATOR = '/'
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

        getMetadata() {
            return this._dispatch('getMetadata')
        }

        moveTo(parent, newName) {
            this._dispatch('moveTo', [...arguments])
        }

        copyTo() {
            this._dispatch('copyTo', [...arguments])
        }

        toURL() {
            this._dispatch('toURL')
        }

        remove() {
            this._dispatch('remove')
        }

        getParent() {
            this._dispatch('getParent')
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

        write(path, content, type = 'text/plain', append = false) {
            this._dispatch('writeToFile', path, content, type = 'text/plain', append = false)
        }

        //自定义的
    }

    class DirectoryEntry extends Entry {
        constructor(name, fullPath) {
            super(false, true, name, fullPath)
        }

        getFile(path, options = { create: true, exclusive: false }) {
            return this._dispatch('getFile', path, options)
        }

        getDirectory(path, options = { create: true, exclusive: false }) {
            return this._dispatch('getDirectory', path, options)
        }

        removeRecursively() {
            return this._dispatch('removeRecursively')
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
                            this._instance.root = FileSystem.createRoot()
                            FileSystem._instance = this._instance
                            return resolve(this._instance)
                        }
                    } else {
                        this._instance = new FileSystem()
                        this._instance._db = request.result
                        this._instance.root = FileSystem.createRoot()
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

        writeToFile(entry, path, content, type = 'text/plain', append = false) {
            let data = content
            // 不是blob，转为blob
            if (content instanceof ArrayBuffer) {
                data = new Blob([new Uint8Array(content)], { type })
            } else if (typeof content === 'string') {
                data = new Blob([content], { type: 'text/plain' })
            } else {
                data = new Blob([content], { type })
            }
            return this._toPromise('put', data, path).then(() => this.getFile(path))
        }

        getFile(entry, path, { create, exclusive }) {
            path = resolveToFullPath(entry.fullPath, path)
            return this._toPromise('get', path).then(fe => {
                if (create === true && exclusive === true && fe) { //创建 && 排他 && 存在
                    throw new FileError({
                        message: FILE_ERROR.FILE_EXISTED
                    })
                } else if (create === true && !fe) { //创建 && 文件不存在
                    let name = path.split(DIR_SEPARATOR).pop(),
                        fileEntry = new FileEntry(name, path),
                        fileE = new FSFile(name, 0, null, new Date(), null)
                    fileEntry.file = fileE

                    return this._toPromise('put', fileEntry, fileEntry.fullPath).then((r) => {
                        return Entry.copyFrom(fileEntry)
                    })

                } else if (!create && !fe) {// 不创建 && 文件不存在
                    throw NOT_FOUND_ERROR
                } else if (!create && fe && fe.isDirectory) { // 不创建 && 文件存在 && 文件是目录
                    throw new FileError({
                        message: FILE_ERROR.Directory_EXISTED
                    })
                } else {
                    return Entry.copyFrom(fe)
                }
            })
        }

        /**
         * 获得元数据
         * @param {*Entry} entry 
         */
        getMetadata(entry) {
            let f = entry.file || {}
            return new Metadata(f && f.lastModifiedDate || null, f && f.size || 0)
        }
    }


    FileSystem.isSupported = () => {
        self.indexedDB_ = self.indexedDB || self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB
        self.IDBTransaction = self.IDBTransaction || self.webkitIDBTransaction || self.msIDBTransaction
        self.IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange || self.msIDBKeyRange
        return self.indexedDB && self.IDBTransaction && self.IDBKeyRange
    }

    FileSystem._dbName = '_fs_db_'
    FileSystem._storeName = '_fs_store'


    FileSystem.createRoot = function () {
        return new DirectoryEntry('/', '/')
    }

    self.Entry = Entry
    self.FileEntry = FileEntry
    self.DirectoryEntry = DirectoryEntry
    self.FileSystem = FileSystem

})(self)




