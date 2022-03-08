# Linux ELF文件保护机制

> 引用自[Cyberangel-Pwn入门](https://www.yuque.com/cyberangel/rg9gdm/yfrste)

---

**Canary**

Stack Canary表示栈的报警保护，在函数返回值前添加一串不超过机器字长的随机数（Cookie），末位为`/x00`（可以覆盖最后一字节输出泄露Canary）。如果出现缓冲区溢出攻击，覆盖内容到Canary处改变数值，当程序执行到此处检查不一样，就会崩溃来保护返回地址。



GCC中：

```shell
gcc -o test test.c // 默认情况下，不开启Canary保护
gcc -fno-stack-protector -o test test.c //禁用栈保护
gcc -fstack-protector -o test test.c //启用堆栈保护，不过只为局部变量中含有 char 数组的函数插入保护代码
gcc -fstack-protector-all -o test test.c //启用堆栈保护，为所有函数插入保护代码
-fno-stack-protector /-fstack-protector / -fstack-protector-all (关闭 / 开启 / 全开启)
```

---

**NX**

即no-execute（不可执行），Windows上称为DEP，原理是将数据所在内存页标识为不可执行，当程序溢出转入shellcode后，尝试在数据页面执行指令时，CPU就抛出异常禁止执行。



GCC用法：

```shell
gcc -o test test.c // 默认情况下，开启NX保护
gcc -z execstack -o test test.c // 禁用NX保护
gcc -z noexecstack -o test test.c // 开启NX保护
-z execstack / -z noexecstack (关闭 / 开启)
```

---

**PIE（ASLR）**

地址空间随机化，一般和NX（DEP）同时工作，能防止根据固定地址来写exp执行攻击。

内存地址随机化三种情况：

- 0：关闭进程地址空间随机化
- 1：随机化mmap的基址，栈基地址，.so的地址
- 2：在1基础上增加heap的地址随机化



Linux关闭PIE的命令：`sudo -s echo 0 > /proc/sys/kernel/randomize_va_space`

GCC用法：

```shell
gcc -o test test.c // 默认情况下，不开启PIE
gcc -fpie -pie -o test test.c // 开启PIE，此时强度为1
gcc -fPIE -pie -o test test.c // 开启PIE，此时为最高强度2
gcc -fpic -o test test.c // 开启PIC，此时强度为1，不会开启PIE
gcc -fPIC -o test test.c // 开启PIC，此时为最高强度2，不会开启PIE
-no-pie / -pie (关闭 / 开启)
```

---

**RELRO**

使程序部分成为只读的，分为部分只读和完全只读。

GCC默认部分只读，只能防止全局变量上的缓冲区溢出从而覆盖GOT；而完全只读使整个GOT只读无法覆盖，但增加程序启动时间（需要启动前解析所有符号）

> 在Linux中可以写的存储区就会是攻击的目标，尤其是存储指针的区域，RELRO会设置GOT表为只读，如果partial RELRO说明对GOT表有写权限

- partial RELRO：.got不可写，got.plt可写
- full RELRO：.got和got.plt不可写
- got.plt可以简称为got表



GCC用法：

```shell
gcc -o test test.c // 默认情况下，是Partial RELRO
gcc -z norelro -o test test.c // 关闭，即No RELRO
gcc -z lazy -o test test.c // 部分开启，即Partial RELRO
gcc -z now -o test test.c // 全部开启
-z norelro / -z lazy / -z now (关闭 / 部分开启 / 完全开启)
```

---

**FORTIFY**

轻微的检查，用于检查是否存在缓冲区溢出的错误，适用于程序采用大量的字符串或者内存操作函数

```shell
>>> memcpy():
	描述：void *memcpy(void *str1, const void *str2, size_t n)
    	 从存储区str2复制n个字符到存储区str1
  参数：str1 -- 指向用于存储复制内容的目标数组，类型强制转换为 void* 指针
    	 str2 -- 指向要复制的数据源，类型强制转换为 void* 指针
    	 n -- 要被复制的字节数
  返回值：该函数返回一个指向目标存储区 str1 的指针
---------------------------------------------------------------------------------------
>>> memset():
  描述：void *memset(void *str, int c, size_t n)
    	 复制字符 c（一个无符号字符）到参数 str 所指向的字符串的前 n 个字符
  参数：str -- 指向要填充的内存块
    	 c -- 要被设置的值。该值以 int 形式传递，但是函数在填充内存块时是使用该值的无符号字符形式
    	 n -- 要被设置为该值的字节数
  返回值：该值返回一个指向存储区 str 的指针
---------------------------------------------------------------------------------------
>>> strcpy():
  描述：char *strcpy(char *dest, const char *src)
    	 把 src 所指向的字符串复制到 dest，容易出现溢出
  参数：dest -- 指向用于存储复制内容的目标数组
    	 src -- 要复制的字符串
  返回值：该函数返回一个指向最终的目标字符串 dest 的指针
-------------------------------------------------------------------------------------->>> stpcpy():
  描述：extern char *stpcpy(char *dest,char *src)
    	 把src所指由NULL借宿的字符串复制到dest所指的数组中
  说明：src和dest所指内存区域不可以重叠且dest必须有足够的空间来容纳src的字符串返回指向dest结尾处字符（NULL）的指针	 
  返回值：
---------------------------------------------------------------------------------------    >>> strncpy():
  描述：char *strncpy(char *dest, const char *src, size_t n)
    	 把 src 所指向的字符串复制到 dest，最多复制 n 个字符。当 src 的长度小于 n 时，dest 的剩余部分将用空字节填充
  参数：dest -- 指向用于存储复制内容的目标数组
    	 src -- 要复制的字符串
    	 n -- 要从源中复制的字符数
  返回值：该函数返回最终复制的字符串
--------------------------------------------------------------------------------------->>> strcat():
  描述：char *strcat(char *dest, const char *src)
    	 把 src 所指向的字符串追加到 dest 所指向的字符串的结尾
  参数：dest -- 指向目标数组，该数组包含了一个 C 字符串，且足够容纳追加后的字符串
    	 src -- 指向要追加的字符串，该字符串不会覆盖目标字符串
  返回值：
--------------------------------------------------------------------------------------->>> strncat():
  描述：char *strncat(char *dest, const char *src, size_t n)
    	 把 src 所指向的字符串追加到 dest 所指向的字符串的结尾，直到 n 字符长度为止
  参数：dest -- 指向目标数组，该数组包含了一个 C 字符串，且足够容纳追加后的字符串，包括额外的空字符
    	 src -- 要追加的字符串
    	 n -- 要追加的最大字符数
  返回值：该函数返回一个指向最终的目标字符串 dest 的指针
--------------------------------------------------------------------------------------->>> sprintf():PHP
  描述：sprintf(format,arg1,arg2,arg++)
    	 arg1、arg2、++ 参数将被插入到主字符串中的百分号（%）符号处。该函数是逐步执行的。在第一个 % 符号处，插入 arg1，在第二个 % 符号处，插入 arg2，依此类推
  参数：format -- 必需。规定字符串以及如何格式化其中的变量
    	 arg1 -- 必需。规定插到 format 字符串中第一个 % 符号处的参
    	 arg2 -- 可选。规定插到 format 字符串中第二个 % 符号处的参数
    	 arg++ -- 可选。规定插到 format 字符串中第三、四等等 % 符号处的参数
  返回值：返回已格式化的字符串
--------------------------------------------------------------------------------------->>> snprintf():
  描述：int snprintf ( char * str, size_t size, const char * format, ... )
    	 设将可变参数(...)按照 format 格式化成字符串，并将字符串复制到 str 中，size 为要写入的字符的最大数目，超过 size 会被截断
  参数：str -- 目标字符串
    	 size -- 拷贝字节数(Bytes)如果格式化后的字符串长度大于 size
    	 format -- 格式化成字符串
  返回值：如果格式化后的字符串长度小于等于 size，则会把字符串全部复制到 str 中，并给其后添加一个字符串结束符 \0。 如果格式化后的字符串长度大于 size，超过 size 的部分会被截断，只将其中的 (size-1) 个字符复制到 str 中，并给其后添加一个字符串结束符 \0，返回值为欲写入的字符串长度
--------------------------------------------------------------------------------------->>> vsprintf():PHP
  描述：vsprintf(format,argarray) 
    	 与 sprintf() 不同，vsprintf() 中的参数位于数组中。数组元素将被插入到主字符串中的百分号（%）符号处。该函数是逐步执行的
  参数：format -- 必需。规定字符串以及如何格式化其中的变量
    	 argarray -- 必需。带有参数的一个数组，这些参数会被插到 format 字符串中的 % 符号处
  返回值：以格式化字符串的形式返回数组值
--------------------------------------------------------------------------------------->>> vsnprintf():
  描述：int vsnprintf (char * s, size_t n, const char * format, va_list arg )
    	 将格式化数据从可变参数列表写入大小缓冲区
如果在printf上使用格式，则使用相同的文本组成字符串，但使用由arg标识的变量参数列表中的元素而不是附加的函数参数，并将结果内容作为C字符串存储在s指向的缓冲区中 （以n为最大缓冲区容量来填充）。如果结果字符串的长度超过了n-1个字符，则剩余的字符将被丢弃并且不被存储，而是被计算为函数返回的值。在内部，函数从arg标识的列表中检索参数，就好像va_arg被使用了一样，因此arg的状态很可能被调用所改变。在任何情况下，arg都应该在调用之前的某个时刻由va_start初始化，并且在调用之后的某个时刻，预计会由va_end释放
  参数：s -- 指向存储结果C字符串的缓冲区的指针，缓冲区应至少有n个字符的大小
    	 n -- 在缓冲区中使用的最大字节数，生成的字符串的长度至多为n-1，为额外的终止空字符留下空，size_t是一个无符号整数类型
    	 format -- 包含格式字符串的C字符串，其格式字符串与printf中的格式相同
     	 arg -- 标识使用va_start初始化的变量参数列表的值
  返回值：如果n足够大，则会写入的字符数，不包括终止空字符。如果发生编码错误，则返回负数。注意，只有当这个返回值是非负值且小于n时，字符串才被完全写入
--------------------------------------------------------------------------------------->>> gets():
  描述：char *gets(char *str)
    	 从标准输入 stdin 读取一行，并把它存储在 str 所指向的字符串中。当读取到换行符时，或者到达文件末尾时，它会停止，具体视情况而定
  参数：str -- 这是指向一个字符数组的指针，该数组存储了 C 字符串
  返回值：如果成功，该函数返回 str。如果发生错误或者到达文件末尾时还未读取任何字符，则返回 NULL 	
```



GCC用法：

```shell
gcc -D_FORTIFY_SOURCE=1  仅仅只在编译时进行检查（尤其是#include <string.h>这种文件头）
gcc -D_FORTIFY_SOURCE=2  程序执行时也会进行检查（如果检查到缓冲区溢出，就会终止程序）
```

在`-D_FORTIFY_SOURCE=2`时，通过堆数组大小来判断替换strcpy、memcpy、memset等函数名



> 上一篇：[C语言调用与栈帧的分析](/docs/c.md)		下一篇：无
