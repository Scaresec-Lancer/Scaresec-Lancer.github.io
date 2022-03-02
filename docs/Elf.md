# 从源代码到可执行文件

**编译原理**


- 词法分析（Lexical analysis）：读入源程序的字符流，输出为有意义的词素（Lexeme）
- 语法分析（Syntax analysis）：根据各个词法单元的第一个分量来创建树型的中间表示形式，通常是语法树（Syntax tree）
- 语义分析（Semantic analysis）：使用语法树和符号表中的信息，检测源程序是否满足语言定义的语义约束，同时收集类型信息，用于代码生成、类型检查和类型转换
- 中间代码生成和优化：根据语义分析输出，生成类机器语言的中间表示，如三地址码。然后对生成的中间代码进行分析和优化
- 代码生成和优化：把中间表示形式映射到目标机器语言。



![](https://pic.imgdb.cn/item/61dff8592ab3f51d91741693.jpg#crop=0&crop=0&crop=1&crop=1&id=ng55M&originHeight=656&originWidth=566&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)


## GCC编译过程
更详细的：[https://blog.csdn.net/czg13548930186/article/details/78331692](https://blog.csdn.net/czg13548930186/article/details/78331692)


**源程序 hello.c**


```c
#include<stdio.h>
int main(){
    printf("hello,world\n");
}
```


编译时用`-save-temps`将编译生成的中间文件留下来，用`--verbose`看GCC编译的详细流程，精简后如下


```bash
$ gcc hello.c -o hello -save-temps --verbose

 /usr/lib/gcc/x86_64-linux-gnu/9/cc1 -E -quiet -v -imultiarch x86_64-linux-gnu hello.c -mtune=generic -march=x86-64 -fpch-preprocess -fasynchronous-unwind-tables -fstack-protector-strong -Wformat -Wformat-security -fstack-clash-protection -fcf-protection -o hello.i

 /usr/lib/gcc/x86_64-linux-gnu/9/cc1 -fpreprocessed hello.i -quiet -dumpbase hello.c -mtune=generic -march=x86-64 -auxbase hello -version -fasynchronous-unwind-tables -fstack-protector-strong -Wformat -Wformat-security -fstack-clash-protection -fcf-protection -o hello.s
 
 as -v --64 -o hello.o hello.s
 
 /usr/lib/gcc/x86_64-linux-gnu/9/collect2 -plugin /usr/lib/gcc/x86_64-linux-gnu/9/liblto_plugin.so -plugin-opt=/usr/lib/gcc/x86_64-linux-gnu/9/lto-wrapper -plugin-opt=-fresolution=hello.res ...
```


![](https://pic.imgdb.cn/item/61dffd682ab3f51d91782433.jpg#crop=0&crop=0&crop=1&crop=1&id=w5SRV&originHeight=492&originWidth=1082&originalType=binary&ratio=1&rotation=0&showTitle=false&status=done&style=none&title=)


GCC的编译主要包括四个阶段：预处理（Preprocess）、编译（Compile）、汇编（Assemble）和链接（Link），分别使用了cc1、as和collect2三个工具。


- cc1是编译器，预处理和编译阶段，将源文件hello.c编译为hello.s
- as是汇编器，汇编阶段，将hello.s汇编为hello.o目标文件
- 链接器collect2是对ld命令的封装，将C语言运行时库（CRT）中的目标文件（crt1.o、crti.o、crtbegin.o、crtend.o、crtn.o）以及所需的动态链接库（libgcc.so、libgcc_s.so、libc.so）链接到可执行文件hello



### 预处理阶段


**中间文件hello.i**


```c
# 1 "hello.c"
# 1 "<built-in>"
# 1 "hello.c"
# 1 "/usr/include/x86_64-linux-gnu/bits/libc-header-start.h" 1 3 4
# 33 "/usr/include/x86_64-linux-gnu/bits/libc-header-start.h" 3 4

......

typedef __int8_t __int_least8_t;
typedef __uint8_t __uint_least8_t;
typedef __int16_t __int_least16_t;

......

extern int __uflow (FILE *);
extern int __overflow (FILE *, int);
# 873 "/usr/include/stdio.h" 3 4
# 2 "hello.c" 2

int main(){
    printf("hello,world\n");
}
```


预处理，处理以`#`开始的预处理指令比如`#include`、`#define`，将其转换后直接插入程序文本中。在命令中添加编译选项`-E`可以单独执行预处理


预处理规则：


- 递归处理`#include`预处理指令，将对应文件的内容复制到该指令的位置
- 删除所有的`#define`指令，并且在其被引用的位置递归地展开所有的宏定义
- 处理所有条件预处理指令：`#if`、`#ifdef`、`#elif`、`#else`、`#endif`等
- 删除所有注释，添加行号和文件名标识



### 编译阶段


**中间文件hello.s**


```c
	.file	"hello.c"
	.text
	.section	.rodata
.LC0:
	.string	"hello,world"
	.text
	.globl	main
	.type	main, @function
main:
.LFB0:
	.cfi_startproc
	endbr64
	pushq	%rbp
	.cfi_def_cfa_offset 16
	.cfi_offset 6, -16
	movq	%rsp, %rbp
	.cfi_def_cfa_register 6
	leaq	.LC0(%rip), %rdi
	call	puts@PLT
	movl	$0, %eax
	popq	%rbp
	.cfi_def_cfa 7, 8
	ret
	.cfi_endproc
.LFE0:
	.size	main, .-main
	.ident	"GCC: (Ubuntu 9.4.0-1ubuntu1~20.04) 9.4.0"
	.section	.note.GNU-stack,"",@progbits
	.section	.note.gnu.property,"a"
	.align 8
	.long	 1f - 0f
```


编译，将预处理文件进行词法分析、语法分析、语义分析以及优化，生成汇编代码。在命令中添加编译选项`-S`，操作对象可以是源代码`hello.c`，或预处理文件`hello.i`。


GCC的实际实现中，已将预处理和编译合并处理，GCC默认使用AT&T格式，用`-masm=intel`可以指定为intel格式，用`-fno-asynchronous-unwind-tables`则生成没有cfi宏的汇编指令，以提高可读性


上面的汇编代码中函数`printf()`被替换成了`puts()`，这是因为当`printf()`只有单一参数时与`puts()`是十分类似的，于是GCC就将其替换以提高性能


### 汇编阶段


**objdump查看hello.o**


```bash
dogge@ubuntu:~/Desktop$ file hello.o
hello.o: ELF 64-bit LSB relocatable, x86-64, version 1 (SYSV), not stripped
dogge@ubuntu:~/Desktop$ objdump -sd hello.o -M intel

hello.o:     file format elf64-x86-64

Contents of section .text:
 0000 f30f1efa 554889e5 488d3d00 000000e8  ....UH..H.=.....
 0010 00000000 b8000000 005dc3             .........].     
Contents of section .rodata:
 0000 68656c6c 6f2c776f 726c6400           hello,world.    
Contents of section .comment:
 0000 00474343 3a202855 62756e74 7520392e  .GCC: (Ubuntu 9.
 0010 342e302d 31756275 6e747531 7e32302e  4.0-1ubuntu1~20.
 0020 30342920 392e342e 3000               04) 9.4.0.      
Contents of section .note.gnu.property:
 0000 04000000 10000000 05000000 474e5500  ............GNU.
 0010 020000c0 04000000 03000000 00000000  ................
Contents of section .eh_frame:
 0000 14000000 00000000 017a5200 01781001  .........zR..x..
 0010 1b0c0708 90010000 1c000000 1c000000  ................
 0020 00000000 1b000000 00450e10 8602430d  .........E....C.
 0030 06520c07 08000000                    .R......        

Disassembly of section .text:

0000000000000000 <main>:
   0:	f3 0f 1e fa          	endbr64 
   4:	55                   	push   rbp
   5:	48 89 e5             	mov    rbp,rsp
   8:	48 8d 3d 00 00 00 00 	lea    rdi,[rip+0x0]        # f <main+0xf>
   f:	e8 00 00 00 00       	call   14 <main+0x14>
  14:	b8 00 00 00 00       	mov    eax,0x0
  19:	5d                   	pop    rbp
  1a:	c3                   	ret
```


汇编器将`hello.s`汇编成目标文件`hello.o`。用`-c`，操作对象可以是`hello.s`或`hello.c`，直接生成目标文件


此时还未链接，对象文件中符号的虚拟地址无法确定，于是字符串`hello,world`地址被设为`0x0000`，作为参数传递字符串地址的`rdi`寄存器被设置为`0x0`，而`call puts`指令中函数`puts()`的地址则被设为下一条指令的地址`0xe`。


### 链接阶段


链接，分静态链接和动态链接，GCC默认使用动态链接，用`-static`使用静态链接


这一阶段将目标文件及其依赖库进行链接，生成可执行文件，主要包括地址和空间分配（Address andStorage Allocation）、符号绑定（Symbol Binding）和重定位（Relocation）等操作


链接操作`gcc hello.o -o hello -static`由链接器（ld.so）完成，得到了hello文件，一个静态链接的可执行文件（Executable File）包含了大量的库文件，通过链接操作，对象文件已经被修正为实际的符号地址，程序可以被加载到内存中正常执行


```bash
hello:     file format elf64-x86-64

Contents of section .note.gnu.property:
 400270 04000000 10000000 05000000 474e5500  ............GNU.
 400280 020000c0 04000000 03000000 00000000  ................
Contents of section .note.gnu.build-id:
 400290 04000000 14000000 03000000 474e5500  ............GNU.
 4002a0 edaad7eb 0fe74085 6e8f9f82 2dfb0946  ......@.n...-..F
 4002b0 9ca23d0d                             ..=.            
Contents of section .note.ABI-tag:
 4002b4 04000000 10000000 01000000 474e5500  ............GNU.
 
 ...
 
 
Disassembly of section .fini:

0000000000494700 <_fini>:
  494700:	f3 0f 1e fa          	endbr64 
  494704:	48 83 ec 08          	sub    rsp,0x8
  494708:	48 83 c4 08          	add    rsp,0x8
  49470c:	c3                   	ret
```
