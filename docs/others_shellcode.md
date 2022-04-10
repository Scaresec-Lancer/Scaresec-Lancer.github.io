# others_shellcode

见过的最奇怪的题（直接白给）

## 保护

32位程序，开启了NX（堆栈不可执行）和PIE（地址随机化）双重保护

```bash
$ checksec --file=shell_asm
    Arch:     i386-32-little
    RELRO:    Partial RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      PIE enabled
```



## main函数

```c
int __cdecl main(int argc, const char **argv, const char **envp)
{
  getShell();
  return 0;
}
```



## getShell函数

```c
int getShell()
{
  int result; // eax
  char v1[9]; // [esp-Ch] [ebp-Ch] BYREF

  strcpy(v1, "/bin//sh");
  result = 11;
  __asm { int     80h; LINUX - sys_execve }
  return result;
}
```

`__asm { int 80h; LINUX - sys_execve }`：直接`syscall 80`拿权限了

直接连接服务器执行