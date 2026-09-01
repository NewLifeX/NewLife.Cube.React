using System.ComponentModel;
using NewLife.Configuration;
using XCode.Configuration;

namespace NewLife.Cube;

/// <summary>React皮肤设置</summary>
[DisplayName("React皮肤设置")]
[Config("React")]
public class ReactSetting : Config<ReactSetting>
{
    /// <summary>指向数据库参数字典表</summary>
    static ReactSetting() => Provider = new DbConfigProvider { UserId = 0, Category = "React" };

    #region 表单
    /// <summary>表单风格。inline-三栏同排（对齐MVC），vertical-标签一行控件一行（antd6风格）</summary>
    [Description("表单风格。inline-三栏同排（对齐MVC），vertical-标签一行控件一行（antd6风格）")]
    [Category("表单")]
    public String FormStyle { get; set; } = "inline";

    /// <summary>字段注释显示方式。1-标签后小字，2-标签后问号图标悬浮提示，0-不显示</summary>
    [Description("字段注释显示方式。1-标签后小字，2-标签后问号图标悬浮提示，0-不显示")]
    [Category("表单")]
    public Int32 DescMode { get; set; } = 1;

    /// <summary>文本框清除图标。true-输入框聚焦且非空时显示清空叉叉，false-永不显示</summary>
    [Description("文本框清除图标。true-输入框聚焦且非空时显示清空叉叉，false-永不显示")]
    [Category("表单")]
    public Boolean InputClear { get; set; } = false;

    /// <summary>地区选择方案。cascader-级联下拉（默认），tabs-MVC风格多Tab弹层（省份按大区分组，逐级切换）</summary>
    [Description("地区选择方案。cascader-级联下拉（默认），tabs-MVC风格多Tab弹层（省份按大区分组，逐级切换）")]
    [Category("表单")]
    public String AreaPickerStyle { get; set; } = "cascader";
    #endregion
}
