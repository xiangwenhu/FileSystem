# FileSystem
基于 <a href='https://www.w3.org/TR/file-system-api/' target='_blank'>File System API</a>和<a href='https://www.w3.org/TR/IndexedDB/' target='_blank'>IndexedDB</a>的浏览器文件系统
<br/>
<p>适用前提条件： </p>
<ul>
<li>Promise</li>
<li>ES7 await</li>
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
    FileSystem.getInstance().then(fs=>fs.readEntries()).then(f=>console.log(f))<br/>
    ["music/txt.txt"]
    </li>
    <li>getFile:<br/>
        FileSystem.getInstance().then(fs=>fs.getFile('music/txt.txt')).then(f=>console.log(f))<br/>
        Blob {size: 2711169, type: "null"}
    </li>        
    <li>
        ensureDirectory:<br/>
        FileSystem.getInstance().then(fs=>fs.ensureDirectory('music/vbox')).then(r=>console.log( r))<br/>
        music/vbox
    </li>
    <li>
        readAllEntries:<br/>
        FileSystem.getInstance().then(fs=>fs.readAllEntries()).then(f=>console.log(f))<br/>
        ["music/txt.txt"]
    </li>
    <li>
    clear:<br/>
    FileSystem.getInstance().then(fs=>fs.clear()).then(f=>console.log(f)).catch(err=>console.log(err)) 
    true
    </li>
</ul>
<p>代码示例</p>
<preview>
<!DOCTYPE>
<html>

<head>
    <title> System API 测试页面</title>
</head>

<body>

    <input type="file" id='file' />

    <audio controls id='audio'></audio>


    <script src="FileSystem.js"></script> 

    <script>
        file.addEventListener('change', async function (ev) {

            if (this.files) {

                var reader = new FileReader()

                reader.onload = async function (ev) {

                    var blob = await FileSystem.getInstance().then(fs => fs.writeToFile('music/txt.txt', ev.target.result))
                    audio.src = window.URL.createObjectURL(blob)
                    audio.play()

                }
                reader.readAsArrayBuffer(this.files[0])



            }
        })
    </script>
</body>


</html>
</preview>
