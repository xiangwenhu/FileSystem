# FileSystem
基于 <a href='https://www.w3.org/TR/file-system-api/' target='_blank'>File System API</a>和<a href='https://www.w3.org/TR/IndexedDB/' target='_blank'>IndexedDB</a>的浏览器文件系统
<br/>
<p>适用前提条件： </p>
<ul>
<li>Promise</li>
<li>ES7 awaiy</li>
</ul>

<br/>
#目前支持的接口和数据返回
<ul>
    <li>writeToFile:<br/>
    FileSystem.getInstance().then(fs=>fs.writeToFile('music/txt.txt','爱死你')).then(f=>console.log(f))<br/>
    Blob {size: 9, type: "text/plain"}
    </li>
    <li>
    readEntries:<br/>
    IDBProvider.getInstance().then(fs=>fs.readEntries()).then(f=>console.log(f))<br/>
    ["music/txt.txt"]
    </li>
    <li>getFile:<br/>
        IDBProvider.getInstance().then(fs=>fs.getFile('music/txt.txt')).then(f=>console.log(f))<br/>
        Blob {size: 2711169, type: "null"}
    </li>        
    <li>
        ensureDirectory:<br/>
        IDBProvider.getInstance().then(fs=>fs.ensureDirectory('music/vbox')).then(r=>console.log( r))<br/>
        music/vbox
    </li>
    <li>
        readAllEntries:<br/>
        IDBProvider.getInstance().then(fs=>fs.readAllEntries()).then(f=>console.log(f))<br/>
        ["music/txt.txt"]
    </li>
    <li>
    clear:<br/>
    IDBProvider.getInstance().then(fs=>fs.clear()).then(f=>console.log(f)).catch(err=>console.log(err)) 
    true
    </li>
</ul>
<p>

</p>
