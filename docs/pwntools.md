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



**数据打包**

```python
payload=p32(0xdeadbeef) #将整数打包为32位，对应64位p64，解包用u32/u64
```



**数据输出**

pwntools自带数据输出

```python
some_str="hello,world"
log.info(some_str)
```



**Cyclic Pattern**

生成字符串填入，方便计算溢出距离

```python
cyclic(0x100) # 生成一个0x100大小的pattern，即一个特殊的字符串
cyclic_find(0x61616161) # 找到该数据在pattern中的位置（或者是cyclic -l 0x61616161 ）
cyclic_find('aaaa') # 查找位置也可以使用字符串去定位
```



**汇编与shellcode**

各平台shellcode不同，尤其是32位和64位，所以先设置context

```python
print(shellcraft.sh()) # 打印出shellcode
print(asm(shellcraft.sh())) # 打印出汇编后的shellcode
```



**ELF文件操作**

```python
>>> e = ELF('/bin/cat')
>>> print hex(e.address)  # 文件装载的基地址
0x400000
>>> print hex(e.symbols['write']) # 函数地址,symbols,got,plt均是列表
0x401680
>>> print hex(e.got['write']) # GOT表的地址
0x60b070
>>> print hex(e.plt['write']) # PLT的地址
0x401680
>>> print hex(e.search('/bin/sh').next())# 字符串/bin/sh的地址字符串加（）
```



> 上一篇：[PLT和GOT](/docs/got.md)		下一篇：PIE与ASLR
