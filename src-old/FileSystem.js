if (support.FileSystem) {
    window.FileSystem = FSProvider
} else if (support.IndexedDB) {
    window.FileSystem = IDBProvider
}