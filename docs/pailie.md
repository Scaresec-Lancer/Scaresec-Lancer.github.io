# 重复元素的排列问题



**题目分析**

- 首先要读取文件，忽略第一行的数字，取得第二行的字符串
- 然后去除\n换行符，转换成列表，借sort()进行排序
- 进行全排列，以列表集合为结果输出
- 将列表转换为字符串，再转换为集合去除重复项
- 写入文件，计算集合长度写入



**细节实现**

- 通过引入os和sys模块使得读取和写入文件时支持相对地址
- 利用列表的sort()进行排列
- 利用集合的互异性进行去重



**代码**

```python
import os
import sys

current_addr=os.path.abspath(os.path.dirname(sys.argv[0]))      # 获取当前路径，方便输入输出文件
xulie=[]
xu2=[]

f=open(current_addr+"\\input.txt","r")	
for line in f:
    get_str=line.strip()  # 去除\n换行符，改为小写

str_list=list(get_str)  # 字符串转换成列表
str_list.sort()     # 进行排序

def perm(arr):      # 进行全排列
    length = len(arr)
    if length == 1:  # 递归出口
        return [arr]

    result = []  # 存储结果
    fixed = arr[0]
    rest = arr[1:]

    for _arr in perm(rest):  # 遍历上层的每一个结果
        for i in range(0, length):  # 插入每一个位置得到新序列
            new_rest = _arr.copy()  # 需要复制一份
            new_rest.insert(i, fixed)
            result.append(new_rest)
    return result

r = perm(str_list)
for i in r:
    xu2.append(''.join(i))  #列表转换成字符串
    
fin_set=set(xu2)    # 转换成集合，去除重复

with open(current_addr+"\\output.txt",'w') as fp:   # 写入文件
    for i in fin_set:
        fp.write(i+'\n')
    
    fp.write(str(len(fin_set))) # 写入数字

fp.close()
```





