
# 基于indexedDB和promise的文件系统
<br/>
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
## 如何使用

<code>
    window.onload = async function () {

        let fs = await FileSystem.getInstance()           
        let dir = await fs.root.getDirectory('测试文件夹1')
        let file = await fs.root.getFile('测试文件1')
        file.write('我爱北京天安门')     
        
    };
</code>

<br/>
## 文档API
先等等，作者很忙，暂时还是看源码吧

