let _files = document.querySelector('.files'),
    _rMenu = document.getElementById("right-menu"),
    _pMenu = document.querySelector('.menu>ul'),
    fs = null

const FileUtil = {
    isFolder(f) {
        return !f.type && f.size % 4096 == 0
    }
}

window.onload = async function () {

    fs = await FileSystem.getInstance()
    console.log(fs)
    var entries = await fs.root.getEntries()
    //展示目录路径
    displayPath(fs.root.fullPath)
    //展示当前目录下的Entry
    displayEntries(entries)

    // 右键菜单
    registerRightMenu()
    // Directory点击
    registerEntryEvents(fs)
    // 路径点击
    registerPathEvents(fs)
    //注册拖拽事件
    registerDragEvents(fs)
};

// 展示目录路径
function displayPath(fullPath) {
    _pMenu.innerHTML = buildPathMenu(fullPath)
}

function buildPathMenu(fullPath) {
    let iHtml = ''
    if (fullPath === '/') {
        iHtml = buildPathMenuItem(fullPath, 'root')
    } else {
        let parr = fullPath.split('/'), tp
        for (let i = 0; i < parr.length; i++) {
            if (i === 0) {
                iHtml += buildPathMenuItem('/', 'root')
            } else {
                tp = parr.slice(0, i + 1)
                iHtml += ' > ' + buildPathMenuItem(tp.join('/'), parr[i])
            }
        }
    }

    return iHtml
}

function buildPathMenuItem(fullPath, name) {
    return `<li><a href="javascript:void(0)" data-fullPath="${fullPath}">${name}</a></li>`
}

function displayEntries(entries) {
    let isFile, iHtml = ''
    // 文件夹在前
    entries.sort((e1, e2) => e1.isDirectory ? -1 : 1).forEach((entry) => {
        iHtml += buildEntry(entry.fullPath, entry.isFile)
    })

    _files.innerHTML = iHtml
}

function buildEntry(fullPath, isFile) {
    let name = fullPath.split('/').pop()
    return (
        `<figure class="item ellipsis">
                    <img src="images/${isFile ? 'file' : 'folder'}.png" alt="${name}" data-fullPath='${fullPath}'></img>
                    <p class='ellipsis' title='${name}'>${name}</p>
        </figure>`)
}

function registerRightMenu() {
    _files.oncontextmenu = function (event) {
        var event = event || window.event;

        //显示菜单  
        _rMenu.style.display = "block"
        //菜单定位  
        _rMenu.style.left = event.pageX + "px"
        _rMenu.style.top = event.pageY + "px"
        hiddenEvents()
        //return false为了屏蔽默认事件  
        event.stopPropagation()
        return false

    };
    //再次点击，菜单消失  
    document.onclick = function () {
        _rMenu.style.display = "none";
    };

    document.oncontextmenu = () => {
        _rMenu.style.display = 'none'
    }
}

function registerPathEvents(fs) {
    _pMenu.addEventListener('click', (ev) => {
        let el = ev.target, fullPath = el.getAttribute('data-fullPath')
        // 进入特定目录
        if (el.tagName == 'A' && fullPath) {
            entryEntry(fs, fullPath)
        }
    })
}

function registerEntryEvents(fs) {

    _files.addEventListener('click', (ev) => {
        let el = ev.target, fullPath = el.getAttribute('data-fullPath')
        // 进入深一级目录
        if (el.tagName == 'IMG' && fullPath && el.src.endsWith('folder.png')) {
            entryEntry(fs, fullPath)
        }
    })
}

async function entryEntry(fs, fullPath) {
    let dir = await fs.root.getDirectory(fullPath)
    let entries = await dir.getEntries()
    displayPath(fullPath)
    displayEntries(entries)
}

//注册拖拽事件
function registerDragEvents(fs) {
    _files.addEventListener('drop', async function (e) {
        e.stopPropagation();
        e.preventDefault();
        let files = e.dataTransfer.files, file, fileEntry, override
        fullpath = getCurrentPath()
        if (!files || files.length === 0) {
            return
        }
        let currentDir = await fs.root.getDirectory(fullpath)
        for (let i = 0; i < files.length; i++) {
            file = files[i]
            try {
                if (FileUtil.isFolder(file)) { //文件夹
                    await currentDir.getDirectory(file.name)
                } else { // 文件
                    try {
                        // 不存在不创建， 会返回404
                        fileEntry = await currentDir.getFile(file.name, { create: false })
                    } catch (err) {
                        if (err.code === 404) {
                            fileEntry = await currentDir.getFile(file.name, { create: true })
                            fileEntry.write(file, file.type)
                            continue
                        }
                        alert(err.message || '未知错误')
                    }

                    //文件存在,提示覆盖
                    override = window.confirm(`${file.name}已经存在，是否覆盖？`)
                    if (!override) {
                        continue
                    }
                    fileEntry.write(file, file.type)
                }
            } catch (err) {
                alert(err.message || '未知错误')
                break
            }
        }
        entryEntry(fs, fullpath)
    }, false)

    _files.addEventListener('dragenter', function (e) {
        e.preventDefault();
    }, false)

    _files.addEventListener('dragover', function (e) {
        e.preventDefault();
    }, false)
}

//获得目录全路径
function getCurrentPath() {
    return [..._pMenu.querySelectorAll('li>a')].pop().getAttribute('data-fullpath')
}



// 禁止部分事件
function hiddenEvents() {

}