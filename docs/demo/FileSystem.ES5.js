'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {

    var FILE_ERROR = {
        FILE_EXISTED: '文件已存在',
        Directory_EXISTED: '目录已存在',
        ONLY_FILE_WRITE: '只有文件才能写入',
        NOT_ENTRY: '不是有效的Entry对象',
        INVALID_PATH: '文件名不能包含\\/:*?"<>|'
    };
    var DIR_SEPARATOR = '/';
    var DIR_OPEN_BOUND = String.fromCharCode(DIR_SEPARATOR.charCodeAt(0) + 1);

    /**
     * https://segmentfault.com/q/1010000007499416
     * Promise for forEach
     * @param {*数组} arr 
     * @param {*回调} cb(val)返回的应该是Promise 
     * @param {*是否需要执行结果集} needResults
     */
    var promiseForEach = function promiseForEach(arr, cb, needResults) {
        // lastResult参数暂无用
        var realResult = [],
            lastResult = void 0;
        var result = Promise.resolve();
        Array.from(arr).forEach(function (val, index) {
            result = result.then(function () {
                return cb(val, index).then(function (res) {
                    lastResult = res;
                    needResults && realResult.push(res);
                });
            });
        });

        return needResults ? result.then(function () {
            return realResult;
        }) : result;
    };

    var URLUtil = {
        _pathBlackList: /[/\\:*?"<>|]/,
        // from https://github.com/ebidel/idb.filesystem.js/blob/master/src/idb.filesystem.js
        // When saving an entry, the fullPath should always lead with a slash and never
        // end with one (e.g. a directory). Also, resolve '.' and '..' to an absolute
        // one. This method ensures path is legit!
        resolveToFullPath: function resolveToFullPath(cwdFullPath, path) {
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
        },
        isValidatedPath: function isValidatedPath(path) {
            return this._pathBlackList.test(path) ? true : false;
        }
    };

    var FileError = function FileError() {
        var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { code: 999, message: '未知错误' },
            _ref$code = _ref.code,
            code = _ref$code === undefined ? 999 : _ref$code,
            _ref$message = _ref.message,
            message = _ref$message === undefined ? '未知错误' : _ref$message;

        _classCallCheck(this, FileError);

        this.code = code;
        this.message = message;
    };

    var Metadata = function Metadata(modificationTime, size) {
        _classCallCheck(this, Metadata);

        this.modificationTime = modificationTime;
        this.size = size;
    };

    var FSFile = function FSFile(name, size, type, lastModifiedDate, blob) {
        _classCallCheck(this, FSFile);

        this.name = name;
        this.size = size;
        this.type = type;
        this.lastModifiedDate = lastModifiedDate;
        this.blob = blob;
    };

    var ReaderUtil = {
        read: function read(blob, method) {
            var _arguments = arguments;

            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                var ps = [].slice.call(_arguments, 2);
                ps.unshift(blob);
                reader[method].apply(reader, ps);
                reader.onload = function () {
                    return resolve(reader.result);
                };
                reader.onerror = function (err) {
                    return reject(err);
                };
                reader.onabort = function () {
                    return reject(new Error('读取被中断'));
                };
            });
        },
        readAsArrayBuffer: function readAsArrayBuffer(blob) {
            return this.read(blob, 'readAsArrayBuffer');
        },
        readAsBinaryString: function readAsBinaryString(blob) {
            return this.read(blob, 'readAsBinaryString');
        },
        readAsDataURL: function readAsDataURL(blob) {
            return this.read(blob, 'readAsDataURL');
        },
        readAsText: function readAsText(blob) {
            var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'gb2312';

            return this.read(blob, 'readAsText', encoding);
        }
    };

    var NOT_IMPLEMENTED_ERROR = new FileError({
        code: 1000,
        message: '方法未实现'
    }),
        NOT_FOUND_ERROR = new FileError({
        code: 404,
        message: '未找到'
    }),
        NOT_SUPPORTED = new Error('So Low , So Young');

    var Entry = function () {
        function Entry() {
            var isFile = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
            var isDirectory = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var name = arguments[2];
            var fullPath = arguments[3];

            _classCallCheck(this, Entry);

            this.isFile = isFile;
            this.isDirectory = isDirectory;
            this.name = name;
            this.fullPath = fullPath;
            this.metadata = {
                lastModifiedDate: new Date(),
                size: 0
            };
        }

        /**
         * 获取元数据 done
         */


        _createClass(Entry, [{
            key: 'getMetadata',
            value: function getMetadata() {
                return this._dispatch('getMetadata');
            }
        }, {
            key: 'moveTo',
            value: function moveTo() {
                throw NOT_IMPLEMENTED_ERROR;
                //this._dispatch('moveTo', [...arguments])
            }
        }, {
            key: 'copyTo',
            value: function copyTo() {
                throw NOT_IMPLEMENTED_ERROR;
                // this._dispatch('copyTo', [...arguments])
            }
        }, {
            key: 'toURL',
            value: function toURL() {
                return this._dispatch('toURL');
            }

            /**
             * 删除  done
             */

        }, {
            key: 'remove',
            value: function remove() {
                return this._dispatch('remove');
            }

            /**
             * 获得父目录 done
             */

        }, {
            key: 'getParent',
            value: function getParent() {
                return this._dispatch('getParent');
            }
        }]);

        return Entry;
    }();

    Entry.prototype._dispatch = function (method) {
        var _this = this;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        return new Promise(function (resolve) {
            if (FileSystem._instance) {
                var _FileSystem$_instance;

                return resolve((_FileSystem$_instance = FileSystem._instance)[method].apply(_FileSystem$_instance, [_this].concat(args)));
            }
            return FileSystem.getInstance().then(function (fs) {
                var _FileSystem$_instance2;

                FileSystem._instance = fs;
                return resolve((_FileSystem$_instance2 = FileSystem._instance)[method].apply(_FileSystem$_instance2, [_this].concat(args)));
            });
        });
    };
    Entry.copyFrom = function (entry) {
        var en = entry.isFile ? new FileEntry(entry.name, entry.fullPath, entry.file) : new DirectoryEntry(entry.name, entry.fullPath);
        en.metadata = entry.metadata;
        return en;
    };

    var FileEntry = function (_Entry) {
        _inherits(FileEntry, _Entry);

        function FileEntry(name, fullPath, file) {
            _classCallCheck(this, FileEntry);

            var _this2 = _possibleConstructorReturn(this, (FileEntry.__proto__ || Object.getPrototypeOf(FileEntry)).call(this, true, false, name, fullPath));

            _this2.file = file;
            return _this2;
        }

        /**
         * FileEntry写入数据 done
         * @param {Blob|String|BufferArray} content 
         * @param {String} type 
         * @param {Boolean} append 
         */


        _createClass(FileEntry, [{
            key: 'write',
            value: function write(content) {
                var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'text/plain';
                var append = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

                return this._dispatch('write', content, type, append);
            }
        }, {
            key: 'getBlob',
            value: function getBlob() {
                return this._dispatch('getBlob');
            }
        }, {
            key: 'readAsArrayBuffer',
            value: function readAsArrayBuffer() {
                return this._dispatch('readFile', 'readAsArrayBuffer');
            }
        }, {
            key: 'readAsBinaryString',
            value: function readAsBinaryString() {
                return this._dispatch('readFile', 'readAsBinaryString');
            }
        }, {
            key: 'readAsDataURL',
            value: function readAsDataURL() {
                return this._dispatch('readFile', 'readAsDataURL');
            }
        }, {
            key: 'readAsText',
            value: function readAsText() {
                var encoding = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'utf-8';

                return this._dispatch('readFile', 'readAsText', encoding);
            }
        }]);

        return FileEntry;
    }(Entry);

    var DirectoryEntry = function (_Entry2) {
        _inherits(DirectoryEntry, _Entry2);

        function DirectoryEntry(name, fullPath) {
            _classCallCheck(this, DirectoryEntry);

            return _possibleConstructorReturn(this, (DirectoryEntry.__proto__ || Object.getPrototypeOf(DirectoryEntry)).call(this, false, true, name, fullPath));
        }

        /**
         * 获取文件 done
         * @param {String} path 路径
         * @param {Object} options  create:是否创建 ， exclusive 排他
         */


        _createClass(DirectoryEntry, [{
            key: 'getFile',
            value: function getFile(path) {
                var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { create: true, exclusive: false };

                return this._dispatch('getFile', path, options);
            }

            /**
             * 获取目录 done
             * @param {String} path 
             * @param {Object} options 
             */

        }, {
            key: 'getDirectory',
            value: function getDirectory(path) {
                var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { create: true, exclusive: false };

                return this._dispatch('getDirectory', path, options);
            }

            /**
             * 递归删除 done
             */

        }, {
            key: 'remove',
            value: function remove() {
                return this._dispatch('removeRecursively');
            }

            /**
             * 获取目录下的目录和文件
             */

        }, {
            key: 'getEntries',
            value: function getEntries() {
                return this._dispatch('getEntries');
            }
        }, {
            key: 'ensureDirectory',
            value: function ensureDirectory(path) {
                return this._dispatch('ensureDirectory', path);
            }
        }]);

        return DirectoryEntry;
    }(Entry);

    var FileSystem = function () {
        function FileSystem() {
            _classCallCheck(this, FileSystem);

            // DB
            this._db = null;
            // 实例
            this._instance = null;
            // store Name
            this._storeName = FileSystem._storeName;
            // root
            this.root = null;
        }

        _createClass(FileSystem, [{
            key: '_toPromise',
            value: function _toPromise(method) {
                var _this4 = this;

                for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                }

                try {
                    var suc = void 0;
                    if (args.length >= 1 && typeof args[args.length - 1] === 'function') {
                        suc = args[args.length - 1];
                        args = args.slice(0, args.length - 1);
                    }

                    return new Promise(function (resolve, reject) {
                        var _trans$objectStore;

                        // 获得事务
                        var trans = _this4.transaction;
                        // 获得请求
                        var req = (_trans$objectStore = trans.objectStore(_this4._storeName))[method].apply(_trans$objectStore, _toConsumableArray(args));
                        //游标
                        if (['openCursor', 'openKeyCursor'].indexOf(method) >= 0 && suc) {

                            req.onsuccess = function (event) {
                                suc(event);
                            };
                            trans.oncomplete = function () {
                                return resolve();
                            };
                            trans.onsuccess = function () {
                                return resolve();
                            };
                        } else {
                            // 如果是onsuccess 就返回，只表示请求成功，当大文件存储的时候，并不是已经写入完毕才返回
                            //req.onsuccess = event => resolve(event.target.result)
                            trans.oncomplete = function () {
                                return resolve(req.result);
                            };
                            trans.onsuccess = function () {
                                return resolve(req.result);
                            };
                        }
                        // 请求失败
                        req.onerror = function () {
                            return reject(req.error);
                        };
                        // 事务失败
                        trans.onerror = function () {
                            return reject(trans.error);
                        };
                    });
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            /**
             * TODO::// 暂不支持 append
             * @param {Entry} entry 
             * @param {写入的内容} content 
             * @param {blob类型} type 
             * @param {是否是append模式} append 
             */

        }, {
            key: 'write',
            value: function write(entry, content) {
                var type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'text/plain';
                var append = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

                this._checkEntry(entry);
                if (entry.isFile !== true) {
                    throw new FileError({ message: FILE_ERROR.ONLY_FILE_WRITE });
                }
                var data = content;
                // 不是blob，转为blob
                if (content instanceof ArrayBuffer) {
                    data = new Blob([new Uint8Array(content)], { type: type });
                } else if (typeof content === 'string') {
                    data = new Blob([content], { type: 'text/plain' });
                } else {
                    data = new Blob([content], { type: type });
                }
                var file = entry.file;
                if (!file) {
                    // 不存在创建
                    file = new FSFile(entry.fullPath.split(DIR_SEPARATOR).pop(), data.size, type, new Date(), data);
                    entry.metadata.lastModifiedDate = file.lastModifiedDate;
                    entry.metadata.size = data.size;
                    entry.file = file;
                } else {
                    //存在更新
                    file.lastModifiedDate = new Date();
                    file.type = type;
                    file.size = data.size;
                    file.blob = data;
                    entry.metadata.lastModifiedDate = file.lastModifiedDate;
                    entry.metadata.size = data.size;
                }

                return this._toPromise('put', entry, entry.fullPath).then(function () {
                    return entry;
                });
            }

            /**
             * 
             * @param {Entry} entry 
             * @param {String} path 
             * @param {Object} create 是否创建  exclusive排他
             */

        }, {
            key: 'getFile',
            value: function getFile(entry, path, _ref2) {
                var create = _ref2.create,
                    exclusive = _ref2.exclusive;

                return this.getEntry.apply(this, Array.prototype.slice.call(arguments).concat([true]));
            }
        }, {
            key: 'getDirectory',
            value: function getDirectory(entry, path, _ref3) {
                var create = _ref3.create,
                    exclusive = _ref3.exclusive;

                return this.getEntry.apply(this, Array.prototype.slice.call(arguments).concat([false]));
            }
        }, {
            key: 'remove',
            value: function remove(entry) {
                this._checkEntry(entry);
                return this._toPromise('delete', entry.fullPath).then(function () {
                    return true;
                });
            }
        }, {
            key: 'removeRecursively',
            value: function removeRecursively(entry) {
                this._checkEntry(entry);
                var range = IDBKeyRange.bound(entry.fullPath, entry.fullPath + DIR_OPEN_BOUND, false, true);
                return this._toPromise('delete', range).then(function () {
                    return true;
                });
            }

            /**
             * 获得元数据
             * @param {Entry} entry 
             */

        }, {
            key: 'getMetadata',
            value: function getMetadata(entry) {
                var f = entry.file || {};
                return new Metadata(f && f.lastModifiedDate || null, f && f.size || 0);
            }

            /**
             * 获取文件或者目录
             * @param {Entry} entry 
             * @param {String} path 
             * @param {String} param2 
             * @param {Boolean} getFile true获取文件 false 获取目录
             */

        }, {
            key: 'getEntry',
            value: function getEntry(entry, path, _ref4) {
                var _this5 = this;

                var create = _ref4.create,
                    _ref4$exclusive = _ref4.exclusive,
                    exclusive = _ref4$exclusive === undefined ? false : _ref4$exclusive;
                var getFile = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

                this._checkEntry(entry);
                if (path === DIR_SEPARATOR) {
                    // 如果获取'/'直接返回当前目录
                    return entry;
                }
                path = URLUtil.resolveToFullPath(entry.fullPath, path);
                return this._toPromise('get', path).then(function (fe) {
                    if (create === true && exclusive === true && fe) {
                        //创建 && 排他 && 存在
                        throw new FileError({
                            message: getFile ? FILE_ERROR.FILE_EXISTED : FILE_ERROR.Directory_EXISTED
                        });
                    } else if (create === true && !fe) {
                        //创建 && 文件不存在
                        var name = path.split(DIR_SEPARATOR).pop(),
                            newEntry = getFile ? new FileEntry(name, path) : new DirectoryEntry(name, path),
                            fileE = getFile ? new FSFile(name, 0, null, new Date(), null) : null;
                        if (getFile) newEntry.file = fileE;
                        return _this5._toPromise('put', newEntry, newEntry.fullPath).then(function () {
                            return Entry.copyFrom(newEntry);
                        });
                    } else if (!create && !fe) {
                        // 不创建 && 文件不存在
                        throw NOT_FOUND_ERROR;
                    } else if (fe && fe.isDirectory && getFile || fe && fe.isFile && !getFile) {
                        // 不创建 && entry存在 && 是目录 && 获取文件 || 不创建 && entry存在 && 是文件 && 获取目录
                        throw new FileError({
                            code: 1001,
                            message: getFile ? FILE_ERROR.Directory_EXISTED : FILE_ERROR.FILE_EXISTED
                        });
                    } else {
                        return Entry.copyFrom(fe);
                    }
                });
            }

            /**
             * 获得父目录
             * @param {Entry} entry 
             */

        }, {
            key: 'getParent',
            value: function getParent(entry) {
                this._checkEntry(entry);
                // 已经是根目录
                if (entry.fullPath === DIR_SEPARATOR) {
                    return entry;
                }
                var parentFullPath = entry.fullPath.substring(0, entry.fullPath.lastIndexOf(DIR_SEPARATOR));
                //上级目录为根目录的情况
                if (parentFullPath === '') {
                    return this.root;
                }
                return this.getDirectory(this.root, parentFullPath, { create: false }, false);
            }

            /**
             * 获得目录下的目录和文件
             * @param {Entry} entry 
             */

        }, {
            key: 'getEntries',
            value: function getEntries(entry) {
                var range = null,
                    results = [];
                if (entry.fullPath != DIR_SEPARATOR && entry.fullPath != '') {
                    //console.log(fullPath + '/', fullPath + DIR_OPEN_BOUND)
                    range = IDBKeyRange.bound(entry.fullPath + DIR_SEPARATOR, entry.fullPath + DIR_OPEN_BOUND, false, true);
                }
                //TODO::游标？
                var valPartsLen = void 0,
                    fullPathPartsLen = void 0;
                return this._toPromise('openCursor', range, function (event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        var val = cursor.value;
                        valPartsLen = val.fullPath.split(DIR_SEPARATOR).length;
                        fullPathPartsLen = entry.fullPath.split(DIR_SEPARATOR).length;
                        if (val.fullPath !== DIR_SEPARATOR) {
                            // 区分根目录和非根目录
                            if (entry.fullPath === DIR_SEPARATOR && valPartsLen < fullPathPartsLen + 1 || entry.fullPath !== DIR_SEPARATOR && valPartsLen === fullPathPartsLen + 1) {
                                results.push(val.isFile ? new FileEntry(val.name, val.fullPath, val.file) : new DirectoryEntry(val.name, val.fullPath));
                            }
                        }
                        cursor['continue']();
                    }
                }).then(function () {
                    return results;
                });
            }
        }, {
            key: 'toURL',
            value: function toURL(entry) {
                this._checkEntry(entry);
                if (entry.file && entry.file.blob) {
                    return URL.createObjectURL(entry.file.blob);
                }
                return null;
            }
        }, {
            key: 'readFile',
            value: function readFile(entry, method) {
                this._checkEntry(entry);
                if (entry.file && entry.file.blob) {
                    for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
                        args[_key3 - 2] = arguments[_key3];
                    }

                    return ReaderUtil.read.apply(ReaderUtil, [entry.file.blob, method].concat(args));
                }
                throw NOT_FOUND_ERROR;
            }
        }, {
            key: 'getBlob',
            value: function getBlob(entry) {
                this._checkEntry(entry);
                if (entry.file && entry.file.blob) {
                    return entry.file.blob;
                }
                throw NOT_FOUND_ERROR;
            }

            /**
             * 检查Entry
             * @param {*Entry} entry 
             */

        }, {
            key: '_checkEntry',
            value: function _checkEntry(entry) {
                if (!entry || !(entry instanceof Entry)) {
                    throw new FileError({ message: FILE_ERROR.NOT_ENTRY });
                }
            }

            /**
             * 
             * @param {Entry} entry 
             * @param {path} path 
             */

        }, {
            key: 'ensureDirectory',
            value: function ensureDirectory(entry, path) {
                this._checkEntry(entry);
                if (path === DIR_SEPARATOR) {
                    // 如果获取'/'直接返回当前目录
                    return entry;
                }
                var rPath = URLUtil.resolveToFullPath(entry.fullPath, path);
                if (rPath.length < path.length) {
                    return entry;
                }
                path = rPath.substring(entry.fullPath.length);
                var dirs = path.split(DIR_SEPARATOR);
                return promiseForEach(dirs, function (dir, index) {
                    return entry.getDirectory(dirs.slice(0, index + 1).join('/'), { create: true });
                }, true).then(function (dirEntes) {
                    return dirEntes && dirEntes[dirEntes.length - 1];
                }).catch(function (err) {
                    throw err;
                });
            }
        }, {
            key: 'transaction',
            get: function get() {
                return this._db.transaction([this._storeName], IDBTransaction.READ_WRITE || 'readwrite');
            }
        }], [{
            key: 'getInstance',
            value: function getInstance() {
                var _this6 = this;

                var dbVersion = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1.0;

                if (!FileSystem.isSupported) {
                    throw NOT_SUPPORTED;
                }
                if (this._instance) {
                    Promise.resolve(this._instance);
                }
                return new Promise(function (resolve, reject) {
                    var request = self.indexedDB.open(FileSystem._dbName, dbVersion);
                    request.onerror = function () {
                        return reject(null);
                    };
                    request.onsuccess = function () {
                        var db = request.result;
                        // 老版本，新版本是onupgradeneeded
                        if (db.setVersion && db.version !== dbVersion) {
                            var setVersion = db.setVersion(dbVersion);
                            setVersion.onsuccess = function () {
                                db.createObjectStore(this._storeName);
                                this._instance = new FileSystem();
                                this._instance._db = request.result;
                                this._instance.root = new DirectoryEntry('/', '/');
                                FileSystem._instance = this._instance;
                                return resolve(this._instance);
                            };
                        } else {
                            _this6._instance = new FileSystem();
                            _this6._instance._db = request.result;
                            _this6._instance.root = new DirectoryEntry('/', '/');
                            FileSystem._instance = _this6._instance;
                            return resolve(_this6._instance);
                        }
                        return null;
                    };
                    request.onupgradeneeded = function (event) {
                        event.target.result.createObjectStore(_this6._storeName);
                    };
                });
            }
        }]);

        return FileSystem;
    }();

    FileSystem.isSupported = function () {
        self.indexedDB_ = self.indexedDB || self.mozIndexedDB || self.webkitIndexedDB || self.msIndexedDB;
        self.IDBTransaction = self.IDBTransaction || self.webkitIDBTransaction || self.msIDBTransaction;
        self.IDBKeyRange = self.IDBKeyRange || self.webkitIDBKeyRange || self.msIDBKeyRange;
        return !!(self.indexedDB && self.IDBTransaction && self.IDBKeyRange);
    };

    FileSystem._dbName = '_fs_db_';
    FileSystem._storeName = '_fs_store';

    self.FILE_ERROR = FILE_ERROR;
    self.URLUtil = URLUtil;
    self.ReaderUtil = ReaderUtil;
    self.Entry = Entry;
    self.FileEntry = FileEntry;
    self.DirectoryEntry = DirectoryEntry;
    self.FileSystem = FileSystem;
})(self);