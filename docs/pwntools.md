# pwntools学习

> 本文转自：[Cyberangel-Pwn入门](https://www.yuque.com/cyberangel/rg9gdm/uqazzg#bb8Gf)

---

**大致框架**

```python
from pwn import *	# 导入pwntools模块

context(archzhiming3端口 = 'i386',os = 'linux')	# 设置目标机器信息

r = remote('exploitme.example.com',8080)	#建立一个远程连接,url或ip作为地址，指明端口

r = process("./test")	# 调试本地文件test

asm(shellcraft.sh())	# asm()将字符串转换成汇编的机器代码比如`\xb8\x00\x00\x00\x00`，shellcraft是生成shellcode的模块，比如shellcarft.amd64是AMD64架构，shellcraft.i386是80386架构，shellcraft.common通用架构，而shellcraft.sh()是执行/bin/sh的shellcode

r.send()	# 将shellcode发送

r.interactive()	#将控制权交给用户
```



**Context设置**

由于二进制文件情况不同，可能需要进行一些环境设置才能正常运行exp，比如需要汇编，32位和64位汇编不同，如果不设置context会导致问题

```python
context(os='linux', arch='amd64', log_level='debug')
```

