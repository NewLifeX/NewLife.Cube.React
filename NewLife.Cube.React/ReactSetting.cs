using System.ComponentModel;
using NewLife.Configuration;
using XCode.Configuration;

namespace NewLife.Cube;

/// <summary>React skin settings</summary>
/// <remarks>Source text is English; translations live in Locales/*.yml and are resolved per request language.</remarks>
[DisplayName("React skin settings")]
[Description("React skin specific settings, such as form style, stored in the parameter dictionary")]
[Config("React")]
public class ReactSetting : Config<ReactSetting>
{
    /// <summary>Point to the parameter dictionary table</summary>
    static ReactSetting() => Provider = new DbConfigProvider { UserId = 0, Category = "React" };

    #region 表单
    /// <summary>Form style. inline - three columns in one row (MVC style); vertical - label on one line and control on the next (antd style)</summary>
    [Description("Form style. inline - three columns in one row (MVC style); vertical - label on one line and control on the next (antd style)")]
    [Category("Form")]
    public String FormStyle { get; set; } = "inline";

    /// <summary>Field description display. 1 - small text after the label; 2 - question mark tooltip after the label; 0 - hidden</summary>
    [Description("Field description display. 1 - small text after the label; 2 - question mark tooltip after the label; 0 - hidden")]
    [Category("Form")]
    public Int32 DescMode { get; set; } = 1;

    /// <summary>Text box clear icon. true - show a clear icon when the input is focused and not empty; false - never show</summary>
    [Description("Text box clear icon. true - show a clear icon when the input is focused and not empty; false - never show")]
    [Category("Form")]
    public Boolean InputClear { get; set; } = false;

    /// <summary>Region picker. cascader - cascading dropdown (default); tabs - MVC-style tabbed popup with provinces grouped by region</summary>
    [Description("Region picker. cascader - cascading dropdown (default); tabs - MVC-style tabbed popup with provinces grouped by region")]
    [Category("Form")]
    public String AreaPickerStyle { get; set; } = "cascader";
    #endregion
}
