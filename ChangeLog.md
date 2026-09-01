# NewLife.Cube.React 版本更新记录

## v1.0.2026.0902 (2026-09-02)

### 首次发布
- **独立皮肤包**：`NewLife.Cube.React` 作为魔方第三代 WebAPI 前端的 React 皮肤，从 CubeAntd 迁移并独立成库，引用 `NewLife.Cube` + `NewLife.Cube.React` 即可获得完整管理后台
- **技术栈升级**：适配 React 19 + Ant Design 6 + Zustand + Vite，公共包统一改名为 `@newlifex/*`
- **ReactController/ReactSetting 独立**：从 NewLife.Cube 移入独立类库，皮肤自包含更易维护

### 工作台（仪表盘）
- **工作台重排版**：紧凑渐变横幅 + 12 列部件栅格 + KPI 卡直排，对齐 MVC 观感
- **卡片三能力对齐 MVC**：KPI 卡 MVC 式重设计、指针拖拽、隐藏/排序即时保存服务端
- **系统信息卡片**：KV 每行名值展示 + 更多信息右下角超链接
- **服务器信息页**：新增 `/Admin/Index/Main`，今日登录等跳转带查询参数回显
- **部件管理页**：新增 `/Cube/Widget`，对齐 MVC WidgetController
- **横幅「已隐藏 N」**：恢复面板对齐 MVC（btn-widget-hidden + wb-hidden-pop）

### 列表与表格
- **列自定义**：齿轮按钮自定义列显隐/顺序，后端持久化到用户级
- **高级菜单开发功能**：备份/还原/备份导出/清空数据表，对齐 MVC
- **导出增强**：携带当前查询条件、识别 xlsx/zip 下载，导出菜单改为 Zip
- **双击编辑**：列表页双击行任意位置进入编辑
- **通用渲染**：valueField 通用渲染、名称列优先显示、虚拟头像列用 image 控件
- **垂直紧凑化**：React 皮肤列表页表格可视区加大

### 表单与字段
- **字段控件对齐 MVC**：性别下拉、生日日期、角色多选、备注 wangEditor 富文本
- **省市区级联**：用户搜索区与表单新增省市区级联选择器（对齐 MVC `_Area1~_Area4`）
- **地区选择弹层**：AreaPickerStyle 配置 + AreaTabsPicker 组件，大区分组逐级切换
- **字段名大小写不敏感**：getValueByKey/setValueByKey 及各消费点全面匹配
- **表单回填修复**：修复实体编辑表单 camelCase 字段名回填为空的问题
- **label 自适应**：表单 label 列自适应 4~6 汉字释放控件空间，修复 antd6 输入框未撑满

### 角色权限
- **权限弹窗**：默认折叠只显一级、快捷级联到子孙、单列动态权限位
- **列表行权限按钮**：角色权限列表行「权限」按钮 + 弹窗树形勾选

### 配置系统
- **React 皮肤设置**：表单双风格（FormStyle/DescMode 改下拉）+ 配置导航排开
- **排版对齐 MVC**：配置页 `_Form_Item` 栅格比例、控件列固定、描述单行省略
- **输入框清除图标**：ReactSetting.InputClear 默认隐藏，聚焦时显示

### 日志 / 数据库 / 字典
- **日志页**：性能追踪 TraceId 显示为星尘 TraceUrl 超链接
- **数据库页**：连接字符串列悬浮显示完整 + 隐藏密码
- **字典参数**：长数值 LongValue 改为大文本 textarea

### 诊断与辅助
- **视图解析诊断页**：新增 `/Cube/ViewTrace`，对齐 MVC ViewTraceController
- **地区地图模式**：地区管理新增地图模式，对齐 MVC Map.cshtml

### 测试与质量
- **E2E 覆盖增强**：新增 Zip 下载、第三方登录 SSO 回跳、增删改刷新持久化断言、菜单父编号下拉、部门搜索等用例
- **测试完备**：单测 136 个 + E2E 48 个全过，Playwright 登录会话复用

---
