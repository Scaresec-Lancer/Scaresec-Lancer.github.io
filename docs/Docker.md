# Kali Linux安装Docker环境

安装https协议以及CA证书、dirmngr

```shell
apt update
apt install -y apt-transport-https ca-certificates dirmngr
```



添加GPG密钥

```shell
curl -fsSL https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian/gpg | sudo apt-key add -
```



添加更新源

```shell
echo 'deb https://mirrors.tuna.tsinghua.edu.cn/docker-ce/linux/debian/ buster stable' | sudo tee /etc/apt/sources.list.d/docker.list
```



系统更新以及安装docker

```shell
apt update 
apt install docker-ce
```



启动docker服务器

```shell
systemctl start docker.service 
```



安装compose

```shell
apt install docker-compose
```



docker安装测试(hello-world)

```shell
docker run hello-world
```

