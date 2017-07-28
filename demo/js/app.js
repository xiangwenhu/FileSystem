var _files = document.querySelector('.files'),
    _rMenu = document.getElementById("right-menu"),
    _pMenu = document.querySelector('.menu>ul'),
    fs = null

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
        `<figure class="item">
                    <img src="images/${isFile ? 'file' : 'folder'}.png" alt="${name}" data-fullPath='${fullPath}'></img>
                    <p>${name}</p>
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
function registerDragEvents() {
    _files.addEventListener('drop', function (e) {
        e.stopPropagation();
        e.preventDefault();
        console.log(e.dataTransfer.files)
    }, false)


    _files.addEventListener('dragenter', function (e) {
        e.preventDefault();
    }, false)

    _files.addEventListener('dragover', function (e) {
        e.preventDefault();
    }, false)
}

  

    // 禁止部分事件
    function hiddenEvents() {

    }