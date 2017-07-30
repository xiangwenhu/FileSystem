
# 基于indexedDB和promise的文件系统
<br/>
## 如何使用
<pre>
    window.onload = async function () {

        let fs = await FileSystem.getInstance()           
        let dir = await fs.root.getDirectory('测试文件夹1')
        let file = await fs.root.getFile('测试文件1')
        await file.write('我爱北京天安门')   
        file.readAsText().then(content => console.log(content))
        
    }
</pre>

<br/>
## 文档API
先等等，作者很忙，暂时还是看源码吧


<p>演示地址： <a href='https://xiangwenhu.github.io/FileSystem/demo/' target='blank'>https://xiangwenhu.github.io/FileSystem/demo/</a></p>
<br/>
## 演示效果截图
<p>
    <img src='docs/screenshot/ss1.jpg' alt='' ></img>
</p>
<p>
    <img src='docs/screenshot/ss2.jpg' alt='' ></img>
</p>
<p>
    <img src='docs/screenshot/ss3.jpg' alt='' ></img>
</p>
<p>
    <img src='docs/screenshot/ss4.jpg' alt='' ></img>
</p>

<br/>


