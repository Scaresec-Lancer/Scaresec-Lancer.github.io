import{_ as n,o as s,c as a,a as t}from"./app.27eca155.js";const e={},o=t(`<h2 id="步骤" tabindex="-1"><a class="header-anchor" href="#步骤" aria-hidden="true">#</a> 步骤</h2><p>我家的光猫是【天翼网关 HS8145X6】，实测有 IPv6 地址，但是笔记本上搭建的本地服务从外部无法连接，推测是光猫防火墙处于开启状态导致。天翼网关<code>192.168.1.1</code>的管理网页并没有防火墙的选项，所以要去维修后台看，快速装维入口就在网关页面下方。</p><p>维修后台有两个用户，普通用户：账号密码和管理页面的一样，就在光猫背后；还有个超级管理员账户，需要超管密码才可以，这个需要我们破解一下，抓包工具就用 Burp suite</p><p>电脑连接光猫的网络，然后开热点让手机连接。手机上在 WiFi 界面设置代理为电脑的 IP 地址和端口。在手机浏览器上访问电脑的IP 地址，下载证书安装到手机并选择信任。（自行搜索burpsuite抓）</p><p>打开小翼管家，进入网关管理界面关闭指示灯的开关。打开BP的拦截，打开指示灯的开关，此时BP应该抓到了数据包。</p><p>抓到之后发送到Repeater模块中，将内容修改一下，再重新发送出去。</p><div class="language-go line-numbers-mode" data-ext="go"><pre class="language-go"><code><span class="token punctuation">{</span>
  <span class="token string">&quot;Params&quot;</span><span class="token punctuation">:</span> <span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">,</span>
  <span class="token string">&quot;MethodName&quot;</span><span class="token punctuation">:</span> <span class="token string">&quot;GetTAPasswd&quot;</span><span class="token punctuation">,</span>
  <span class="token string">&quot;RPCMethod&quot;</span><span class="token punctuation">:</span> <span class="token string">&quot;CallMethod&quot;</span><span class="token punctuation">,</span>
  <span class="token string">&quot;ObjectPath&quot;</span><span class="token punctuation">:</span> <span class="token string">&quot;/com/ctc/igd1/Telecom/System&quot;</span><span class="token punctuation">,</span>
  <span class="token string">&quot;InterfaceName&quot;</span><span class="token punctuation">:</span> <span class="token string">&quot;com.ctc.igd1.SysCmd&quot;</span><span class="token punctuation">,</span>
  <span class="token string">&quot;ServiceName&quot;</span><span class="token punctuation">:</span> <span class="token string">&quot;com.ctc.igd1&quot;</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>观察回复的报文数据，其中<code>telecomadmin54224187</code>就是我们要的超管密码了。</p><div class="language-go line-numbers-mode" data-ext="go"><pre class="language-go"><code><span class="token punctuation">{</span>
    <span class="token string">&quot;Ack&quot;</span><span class="token punctuation">:</span><span class="token string">&quot;CallMethod&quot;</span><span class="token punctuation">,</span>
    <span class="token string">&quot;ID&quot;</span><span class="token punctuation">:</span><span class="token string">&quot;5f4a0a82-5812-9637-ecc6-638701be7796&quot;</span><span class="token punctuation">,</span>
    <span class="token string">&quot;Status&quot;</span><span class="token punctuation">:</span><span class="token string">&quot;0&quot;</span><span class="token punctuation">,</span>
    <span class="token string">&quot;Params&quot;</span><span class="token punctuation">:</span><span class="token punctuation">[</span><span class="token string">&quot;telecomadmin54224187&quot;</span><span class="token punctuation">,</span><span class="token number">0</span><span class="token punctuation">,</span><span class="token string">&quot;&quot;</span><span class="token punctuation">]</span>
<span class="token punctuation">}</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>接着进入到光猫的后台，进入安全页面，把防火墙关掉，大功告成。</p>`,10),p=[o];function c(u,i){return s(),a("div",null,p)}const d=n(e,[["render",c],["__file","ipv6.html.vue"]]);export{d as default};
