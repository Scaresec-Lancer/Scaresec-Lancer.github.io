# 0、Docker安装和镜像加速

## 安装

## 加速

```bash
#创建docker文件夹用来放置daemon.json
sudo mkdir -p /etc/docker

#编辑daemon.json
sudo gedit /etc/docker/daemon.json

#写入以下内容
{
  "registry-mirrors": ["https://sdujn51k.mirror.aliyuncs.com"]
}

#重启daemon和docker
sudo systemctl daemon-reload
sudo systemctl restart docker
```



# 1、帮助命令

```bash
docker version	#docker版本信息
docker info		#docker的系统信息，包括镜像和容器的数量
docker 命令 --help	#万能帮助命令
```



# 2、镜像命令

## 列出镜像

```bash
docker images           
#可选
	-a 列出所有镜像
	-q 只列出镜像id
#一般结合使用
docker images -aq
```



## 拉取镜像

```bash
docker pull ubuntu
#可选，tags是镜像版本，不写的话默认latest
docker pull 镜像:tags
#docker采用了联合文件系统，比如Ubuntu 18.04和20.04重复的部分不会重复下载
```



## 搜索镜像

- 直接从Docker Hub网站**https://hub.docker.com/** 搜索镜像
- 通过docker search命令

```bash
docker search ubuntu
#可选
	--filter=
#例如要搜索stars数大于3000的mysql镜像
docker search --filter=STATS=3000
```



## 删除镜像

```bash
docker rmi -f 镜像名		#删除指定镜像
docker rmi -f 镜像名 镜像名 镜像名	#删除多个镜像
docker rmi -f $(docker images -aq) 	#删除所有镜像
```



# 3、容器命令

## 命名容器

```bash
docker container rename 原容器名称 想要的名称
```



## 运行容器

```bash
docker run 可选 image
#参数说明
	--name="Name"	容器名字，用来区分容器
	-d 	以后台方式运行（很多容器没有前台应用就会自动关闭）
	-it	以交互的方式进行
	-p	指定端口
		-p IP:主机端口:容器端口
        -p 主机端口:容器端口	（常用）
        -p	容器端口
#实例
docker run -it -p 8080:8080 ubuntu /bin/bash
```



## 查看容器

```bash
docker ps 
#可选
	-a	列出所有容器（现在的和历史的）
	-q	只显示容器id
	-n=?	显示最近创建的容器，n为展示的个数
```



## 退出容器

```bash
exit	直接退出，容器停止
Ctrl+Q+P	不停止容器退出
```



## 启动和停止容器

```bash
docker start 容器
docker stop 容器
docker pause 容器
docker unpause 容器
docker restart 容器
docker kill 容器
```



## 删除容器

```bash
docker rm -f 容器id 	#删除指定容器
docker rm -f $(docker ps -aq)	#删除所有容器
```



## 进入容器

使用-d参数时，容器会在后台进行，使用docker exec进入容器

```bash
docker exec -it 容器ID /bin/bash
```



也可以使用docker attach进入，但是此方法退出后容器就会停止

```bash
docker attach 容器ID
```



# 4、文件命令

## 复制文件

将主机/www/runoob目录拷贝到容器96f7f14e99ab的/www目录下。

```
docker cp /www/runoob 96f7f14e99ab:/www/
```

将主机/www/runoob目录拷贝到容器96f7f14e99ab中，目录重命名为www。

```
docker cp /www/runoob 96f7f14e99ab:/www
```

将容器96f7f14e99ab的/www目录拷贝到主机的/tmp目录中。

```
docker cp  96f7f14e99ab:/www /tmp/
```
