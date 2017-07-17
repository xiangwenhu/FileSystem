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
<p>
writeToFile:
</p>
<p>
FileSystem.getInstance().then(fs=>fs.writeToFile('music/txt.txt','爱死你')).then(f=>console.log(f))
Blob {size: 9, type: "text/plain"}
</p>
