# Stegsolve：跨平台图片通道查看器

[下载Stegsolve](http://www.caesum.com/handbook/Stegsolve.jar) | 配置Java环境

> StegSolve是一款基于Java开发的流行图片隐写分析软件，该工具不仅可以自动分析图片格式，得出隐藏在文件头、文件块、文件末尾等处的冗余信息，还可以按位查看图片，分析其中的隐藏内容，也支持双图比较，用于得出图片差隐藏的信息。对于动态图片，StegSolve 可以将其分解为单帧保存查看，是一款用于隐写图片分析的强大工具。



Windows下直接下载Stegsolve.jar即可使用（配好Java环境）

在Linux下使用以下命令安装（有Java环境）

```shell
wget http://www.caesum.com/handbook/Stegsolve.jar -O stegsolve.jar
chmod +x stegsolve.jar
mkdir bin
mv stegsolve.jar bin/
```



出于习惯，将改程序打包移到 /opt/stegsolve 目录下，
并将该命令设置为环境变量。

```shell
alias stegsolve='java -jar /opt/stegsolve/bin/stegsolve.jar'
```



常见功能项：

**File Format：文件格式**

**Data Extract：数据提取**

**Steregram Solve：立体试图** 

**Frame Browser：帧浏览器**  

**Image Combiner：拼图**



 
