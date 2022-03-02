# Ubuntu换源

> 代码中为Ubuntu 20.04 LTS的源，其他版本请自行替换

[阿里云镜像站](https://developer.aliyun.com/mirror/) | [清华大学镜像站](https://mirrors.tuna.tsinghua.edu.cn/help/ubuntu/)

下面代码改名为`change.sh`，追加执行权`chmod +x change.sh`，执行`./change.sh`

```shell
sudo chmod 777 /etc/apt/sources.list

echo """
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse

deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse

""" > /etc/apt/sources.list

sudo apt update
```

